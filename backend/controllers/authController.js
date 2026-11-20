const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const RefreshToken = require("../models/refreshTokenSchema");
const { httpError, publicUser } = require("../utils/helpers");
const {
  REFRESH_COOKIE,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/tokens");

const createRefreshSession = async (userId) => {
  const token = signRefreshToken(userId);
  const payload = jwt.decode(token);
  if (
    !payload ||
    typeof payload === "string" ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("Refresh token expiration is missing");
  }
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(payload.exp * 1000),
  });
  return token;
};

const signup = async (req, res) => {
  const { username, password, email, displayName } = req.body || {};

  if (
    ![username, password, email, displayName].every(
      (v) => typeof v === "string" && v.trim(),
    )
  ) {
    throw httpError(
      400,
      "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, email và tên hiển thị.",
    );
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (
    username.trim().length > 32 ||
    passwordBytes < 8 ||
    passwordBytes > 72 ||
    displayName.trim().length > 100
  ) {
    throw httpError(
      400,
      "Tên đăng nhập/tên hiển thị quá dài hoặc mật khẩu phải từ 8 đến 72 ký tự.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw httpError(400, "Email không hợp lệ.");
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  }).select("username email");

  if (duplicate) {
    const field =
      duplicate.username === normalizedUsername ? "Tên đăng nhập" : "Email";
    throw httpError(409, `${field} đã tồn tại.`);
  }

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    displayName: displayName.trim(),
  });

  return res.status(201).json({
    message: "Đăng ký thành công",
    user: publicUser(user, { self: true }),
  });
};

const signin = async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    throw httpError(400, "Vui lòng nhập tên đăng nhập và mật khẩu.");
  }

  const user = await User.findOne({
    username: username.trim().toLowerCase(),
  }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw httpError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = await createRefreshSession(user._id);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return res.json({
    user_id: user._id,
    accessToken,
    user: publicUser(user, { self: true }),
  });
};

const signout = async (req, res) => {
  const token = req.cookies && req.cookies[REFRESH_COOKIE];
  if (token) await RefreshToken.deleteOne({ tokenHash: hashToken(token) });
  const clearOptions = { ...refreshCookieOptions() };
  delete clearOptions.maxAge;
  res.clearCookie(REFRESH_COOKIE, clearOptions);
  return res.sendStatus(204);
};

const refreshToken = async (req, res) => {
  const token = req.cookies && req.cookies[REFRESH_COOKIE];
  if (!token) throw httpError(401, "Thiếu phiên đăng nhập.");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (_err) {
    throw httpError(403, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }

  if (!payload || typeof payload === "string" || !payload.sub) {
    throw httpError(403, "Phiên đăng nhập không hợp lệ.");
  }

  const user = await User.findById(payload.sub).select("_id");
  if (!user) throw httpError(403, "Phiên đăng nhập không hợp lệ.");

  const session = await RefreshToken.findOneAndDelete({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session)
    throw httpError(403, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");

  const accessToken = signAccessToken(user._id.toString());
  const nextRefreshToken = await createRefreshSession(user._id);
  res.cookie(REFRESH_COOKIE, nextRefreshToken, refreshCookieOptions());
  return res.json({ accessToken });
};

module.exports = { signup, signin, signout, refreshToken };

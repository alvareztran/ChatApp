const User = require("../models/userSchema");
const { httpError, isValidObjectId, publicUser } = require("../utils/helpers");
const { saveAvatar, removeAvatar } = require("../utils/avatarStorage");

const getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");
  return res.json(publicUser(user, { self: true }));
};

const updateMe = async (req, res) => {
  const { displayName, avatarUrl, avatarId, bio, phone } = req.body || {};
  const fields = { displayName, avatarUrl, avatarId, bio, phone };
  const updates = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (typeof value !== "string")
      throw httpError(400, `Trường ${key} phải là chuỗi ký tự.`);
    const normalized = value.trim();
    if (key === "displayName" && (!normalized || normalized.length > 100))
      throw httpError(400, "Tên hiển thị phải có từ 1 đến 100 ký tự.");
    if (key === "bio" && normalized.length > 500)
      throw httpError(400, "Tiểu sử không được vượt quá 500 ký tự.");
    if ((key === "avatarUrl" || key === "avatarId") && normalized.length > 2048)
      throw httpError(400, `Trường ${key} quá dài.`);
    updates[key] = normalized;
  }

  if (Object.keys(updates).length === 0)
    throw httpError(400, "Cần cập nhật ít nhất một thông tin hồ sơ.");

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");
  return res.json({
    message: "Cập nhật hồ sơ thành công",
    user: publicUser(user, { self: true }),
  });
};

const updateAvatar = async (req, res) => {
  if (!req.file) throw httpError(400, "Vui lòng chọn ảnh đại diện.");

  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");

  let saved;
  try {
    saved = await saveAvatar(req.file.buffer, req.userId);
  } catch (_err) {
    throw httpError(400, "Tệp ảnh không hợp lệ.");
  }

  const previousAvatarId = user.avatarId;
  user.avatarUrl = saved.url;
  user.avatarId = saved.filename;
  await user.save();
  if (previousAvatarId && previousAvatarId !== saved.filename)
    await removeAvatar(previousAvatarId);

  return res.json({
    message: "Cập nhật ảnh đại diện thành công",
    user: publicUser(user, { self: true }),
  });
};

const searchUsers = async (req, res) => {
  const keyword = (req.query.keyword || req.query.q || "").trim();
  if (!keyword) throw httpError(400, "Vui lòng nhập từ khóa tìm kiếm.");
  if (keyword.length > 100) throw httpError(400, "Từ khóa tìm kiếm quá dài.");

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [
      { username: { $regex: escaped, $options: "i" } },
      { displayName: { $regex: escaped, $options: "i" } },
    ],
  })
    .select("username displayName avatarUrl avatarId bio")
    .limit(20);

  return res.json(users.map(publicUser));
};

const getUser = async (req, res) => {
  if (!isValidObjectId(req.params.user_id))
    throw httpError(400, "Mã người dùng không hợp lệ.");
  const user = await User.findById(req.params.user_id);
  if (!user) throw httpError(404, "Không tìm thấy người dùng.");
  return res.json(publicUser(user));
};

module.exports = { getMe, updateMe, updateAvatar, searchUsers, getUser };

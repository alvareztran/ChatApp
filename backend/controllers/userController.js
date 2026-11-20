const User = require("../models/userSchema");
const { httpError, isValidObjectId, publicUser } = require("../utils/helpers");

const getMe = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw httpError(404, "User not found");
  return res.json(publicUser(user, { self: true }));
};

const updateMe = async (req, res) => {
  const { displayName, avatarUrl, avatarId, bio, phone } = req.body || {};
  const fields = { displayName, avatarUrl, avatarId, bio, phone };
  const updates = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (typeof value !== "string")
      throw httpError(400, `${key} must be a string`);
    const normalized = value.trim();
    if (key === "displayName" && (!normalized || normalized.length > 100))
      throw httpError(400, "displayName must contain 1 to 100 characters");
    if (key === "bio" && normalized.length > 500)
      throw httpError(400, "bio must not exceed 500 characters");
    if ((key === "avatarUrl" || key === "avatarId") && normalized.length > 2048)
      throw httpError(400, `${key} is too long`);
    updates[key] = normalized;
  }

  if (Object.keys(updates).length === 0)
    throw httpError(400, "At least one profile field is required");

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!user) throw httpError(404, "User not found");
  return res.json({
    message: "Profile updated successfully",
    user: publicUser(user, { self: true }),
  });
};

const searchUsers = async (req, res) => {
  const keyword = (req.query.keyword || req.query.q || "").trim();
  if (!keyword) throw httpError(400, "keyword is required");
  if (keyword.length > 100) throw httpError(400, "keyword is too long");

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
    throw httpError(400, "Invalid user ID");
  const user = await User.findById(req.params.user_id);
  if (!user) throw httpError(404, "User not found");
  return res.json(publicUser(user));
};

module.exports = { getMe, updateMe, searchUsers, getUser };

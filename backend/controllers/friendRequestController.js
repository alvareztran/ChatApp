const Friend = require("../models/friendSchema");
const FriendRequest = require("../models/friendRequestSchema");
const User = require("../models/userSchema");
const { httpError, isValidObjectId, publicUser } = require("../utils/helpers");

const getReceivedRequests = async (req, res) => {
  const requests = await FriendRequest.find({
    to: req.userId,
    status: "pending",
  })
    .populate("from", "username displayName avatarUrl avatarId")
    .sort({ createdAt: -1 });
  return res.json(requests);
};

const sendFriendRequest = async (req, res) => {
  const { toUserId, message } = req.body || {};
  if (!isValidObjectId(toUserId))
    throw httpError(400, "Người nhận không hợp lệ.");
  if (toUserId === req.userId)
    throw httpError(400, "Bạn không thể gửi lời mời kết bạn cho chính mình.");
  if (message !== undefined && typeof message !== "string")
    throw httpError(400, "Lời nhắn phải là chuỗi ký tự.");

  const target = await User.findById(toUserId).select("_id");
  if (!target) throw httpError(404, "Không tìm thấy người dùng.");

  const existingFriend = await Friend.findOne({
    $or: [
      { user_A: req.userId, user_B: toUserId },
      { user_A: toUserId, user_B: req.userId },
    ],
  });
  if (existingFriend) throw httpError(409, "Hai bạn đã là bạn bè.");

  const existingRequest = await FriendRequest.findOne({
    status: "pending",
    $or: [
      { from: req.userId, to: toUserId },
      { from: toUserId, to: req.userId },
    ],
  });
  if (existingRequest)
    throw httpError(409, "Đã có lời mời kết bạn đang chờ xử lý.");

  const request = await FriendRequest.create({
    from: req.userId,
    to: toUserId,
    message: typeof message === "string" ? message.trim() : "",
  });
  return res.status(201).json({ message: "Đã gửi lời mời kết bạn", request });
};

const acceptFriendRequest = async (req, res) => {
  if (!isValidObjectId(req.params.requestId))
    throw httpError(400, "Mã lời mời không hợp lệ.");
  const request = await FriendRequest.findOne({
    _id: req.params.requestId,
    to: req.userId,
    status: "pending",
  });
  if (!request) throw httpError(404, "Không tìm thấy lời mời kết bạn đang chờ xử lý.");

  try {
    const [userA, userB] = [
      request.from.toString(),
      request.to.toString(),
    ].sort();
    await Friend.create({ user_A: userA, user_B: userB });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  await FriendRequest.updateOne(
    { _id: request._id, to: req.userId, status: "pending" },
    { $set: { status: "accepted" } },
  );
  return res.json({ message: "Đã chấp nhận lời mời kết bạn" });
};

const rejectFriendRequest = async (req, res) => {
  if (!isValidObjectId(req.params.requestId))
    throw httpError(400, "Mã lời mời không hợp lệ.");
  const request = await FriendRequest.findOneAndUpdate(
    { _id: req.params.requestId, to: req.userId, status: "pending" },
    { $set: { status: "rejected" } },
    { new: true },
  );
  if (!request) throw httpError(404, "Không tìm thấy lời mời kết bạn đang chờ xử lý.");
  return res.json({ message: "Đã từ chối lời mời kết bạn" });
};

module.exports = {
  getReceivedRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
};

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
    throw httpError(400, "A valid recipient ID is required");
  if (toUserId === req.userId)
    throw httpError(400, "You cannot send a friend request to yourself");
  if (message !== undefined && typeof message !== "string")
    throw httpError(400, "message must be a string");

  const target = await User.findById(toUserId).select("_id");
  if (!target) throw httpError(404, "User not found");

  const existingFriend = await Friend.findOne({
    $or: [
      { user_A: req.userId, user_B: toUserId },
      { user_A: toUserId, user_B: req.userId },
    ],
  });
  if (existingFriend) throw httpError(409, "You are already friends");

  const existingRequest = await FriendRequest.findOne({
    status: "pending",
    $or: [
      { from: req.userId, to: toUserId },
      { from: toUserId, to: req.userId },
    ],
  });
  if (existingRequest)
    throw httpError(409, "A pending friend request already exists");

  const request = await FriendRequest.create({
    from: req.userId,
    to: toUserId,
    message: typeof message === "string" ? message.trim() : "",
  });
  return res.status(201).json({ message: "Friend request sent", request });
};

const acceptFriendRequest = async (req, res) => {
  if (!isValidObjectId(req.params.requestId))
    throw httpError(400, "Invalid request ID");
  const request = await FriendRequest.findOne({
    _id: req.params.requestId,
    to: req.userId,
    status: "pending",
  });
  if (!request) throw httpError(404, "Pending friend request not found");

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
  return res.json({ message: "Friend request accepted" });
};

const rejectFriendRequest = async (req, res) => {
  if (!isValidObjectId(req.params.requestId))
    throw httpError(400, "Invalid request ID");
  const request = await FriendRequest.findOneAndUpdate(
    { _id: req.params.requestId, to: req.userId, status: "pending" },
    { $set: { status: "rejected" } },
    { new: true },
  );
  if (!request) throw httpError(404, "Pending friend request not found");
  return res.json({ message: "Friend request rejected" });
};

module.exports = {
  getReceivedRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
};

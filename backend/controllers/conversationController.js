const Conversation = require("../models/conversationSchema");
const Message = require("../models/messageSchema");
const User = require("../models/userSchema");
const { httpError, isValidObjectId } = require("../utils/helpers");
const { emitToUsers } = require("../utils/socket");

const PARTICIPANT_SELECT = "username displayName avatarUrl avatarId";
const SENDER_SELECT = "username displayName avatarUrl avatarId";

/**
 * Fetches a conversation by ID and verifies the requesting user is a participant.
 * Throws an HTTP error if the conversation doesn't exist or the user is not a member.
 */
const getConversationForMember = async (conversationId, userId) => {
  if (!isValidObjectId(conversationId))
    throw httpError(400, "Mã cuộc trò chuyện không hợp lệ.");
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw httpError(404, "Không tìm thấy cuộc trò chuyện.");
  if (!conversation.participants.some((p) => p.toString() === userId)) {
    throw httpError(403, "Bạn không phải thành viên của cuộc trò chuyện này.");
  }
  return conversation;
};

const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.userId })
    .populate("participants", PARTICIPANT_SELECT)
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: SENDER_SELECT },
    })
    .sort({ updatedAt: -1 });
  return res.json(conversations);
};

const createConversation = async (req, res) => {
  const {
    type = "direct",
    participants: requestedParticipants = [],
    name,
  } = req.body || {};

  if (!["direct", "group"].includes(type))
    throw httpError(400, "Loại cuộc trò chuyện phải là direct hoặc group.");
  if (
    !Array.isArray(requestedParticipants) ||
    requestedParticipants.some((id) => !isValidObjectId(id))
  ) {
    throw httpError(400, "Danh sách thành viên không hợp lệ.");
  }

  const participantIds = [
    ...new Set([req.userId, ...requestedParticipants.map(String)]),
  ];
  if (
    participantIds.length < 2 ||
    (type === "direct" && participantIds.length !== 2)
  ) {
    throw httpError(
      400,
      "Trò chuyện riêng cần đúng 2 người, trò chuyện nhóm cần ít nhất 2 người.",
    );
  }
  if (
    type === "group" &&
    typeof name === "string" &&
    name.trim().length > 100
  ) {
    throw httpError(400, "Tên nhóm không được vượt quá 100 ký tự.");
  }

  const usersCount = await User.countDocuments({
    _id: { $in: participantIds },
  });
  if (usersCount !== participantIds.length)
    throw httpError(400, "Một hoặc nhiều người tham gia không tồn tại.");

  if (type === "direct") {
    const existing = await Conversation.findOne({
      type: "direct",
      participants: { $all: participantIds, $size: 2 },
    }).populate("participants", PARTICIPANT_SELECT);
    if (existing) return res.status(200).json(existing);
  }

  const conversation = await Conversation.create({
    participants: participantIds,
    type,
    name: typeof name === "string" ? name.trim() : "",
    createdBy: req.userId,
  });
  await conversation.populate("participants", PARTICIPANT_SELECT);
  emitToUsers(req.app.get("io"), participantIds, "conversation:new", conversation);
  return res
    .status(201)
    .json({ message: "Đã tạo cuộc trò chuyện", conversation });
};

const getConversation = async (req, res) => {
  const conversation = await getConversationForMember(
    req.params.conversation_id,
    req.userId,
  );
  await conversation.populate("participants", PARTICIPANT_SELECT);
  await conversation.populate({
    path: "lastMessage",
    populate: { path: "sender", select: SENDER_SELECT },
  });
  return res.json(conversation);
};

const deleteConversation = async (req, res) => {
  const conversation = await getConversationForMember(
    req.params.conversation_id,
    req.userId,
  );
  const participantIds = conversation.participants.map(String);
  await Message.deleteMany({ conversation: conversation._id });
  await conversation.deleteOne();
  emitToUsers(req.app.get("io"), participantIds, "conversation:deleted", {
    conversationId: conversation._id.toString(),
  });
  return res.json({ message: "Đã xóa cuộc trò chuyện" });
};

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  getConversationForMember,
};

const Conversation = require("../models/conversationSchema");
const Message = require("../models/messageSchema");
const { httpError, isValidObjectId } = require("../utils/helpers");
const { emitToUsers } = require("../utils/socket");
const { getConversationForMember } = require("./conversationController");

const SENDER_SELECT = "username displayName avatarUrl avatarId";

const getMessages = async (req, res) => {
  const conversation = await getConversationForMember(
    req.params.conversation_id,
    req.userId,
  );
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 50;

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", SENDER_SELECT)
    .sort({ createdAt: -1 })
    .limit(limit);
  return res.json(messages.reverse());
};

const sendMessage = async (req, res) => {
  const { conversationId, content = "", imgUrl = "" } = req.body || {};
  if (typeof content !== "string" || typeof imgUrl !== "string") {
    throw httpError(400, "Nội dung tin nhắn không hợp lệ.");
  }
  if (content.trim().length > 5000 || imgUrl.trim().length > 2048) {
    throw httpError(400, "Nội dung tin nhắn hoặc đường dẫn ảnh quá dài.");
  }
  if (!content.trim() && !imgUrl.trim())
    throw httpError(400, "Tin nhắn cần có nội dung hoặc ảnh.");

  const conversation = await getConversationForMember(
    conversationId,
    req.userId,
  );
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.userId,
    content: content.trim(),
    imgUrl: imgUrl.trim(),
  });
  await message.populate("sender", SENDER_SELECT);
  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { lastMessage: message._id }, $currentDate: { updatedAt: true } },
  );

  emitToUsers(req.app.get("io"), conversation.participants, "message:new", message);
  return res.status(201).json(message);
};

const deleteMessage = async (req, res) => {
  if (!isValidObjectId(req.params.message_id))
    throw httpError(400, "Mã tin nhắn không hợp lệ.");
  const message = await Message.findById(req.params.message_id);
  if (!message) throw httpError(404, "Không tìm thấy tin nhắn.");
  if (message.sender.toString() !== req.userId)
    throw httpError(403, "Bạn chỉ có thể xóa tin nhắn của chính mình.");

  const conversation = await getConversationForMember(
    message.conversation.toString(),
    req.userId,
  );
  await message.deleteOne();

  if (
    conversation.lastMessage &&
    conversation.lastMessage.toString() === message._id.toString()
  ) {
    const latestMessage = await Message.findOne({
      conversation: conversation._id,
    }).sort({
      createdAt: -1,
    });
    conversation.lastMessage = latestMessage ? latestMessage._id : null;
    await conversation.save();
  }

  await conversation.populate({
    path: "lastMessage",
    populate: { path: "sender", select: SENDER_SELECT },
  });
  emitToUsers(req.app.get("io"), conversation.participants, "message:deleted", {
    conversationId: conversation._id.toString(),
    messageId: message._id.toString(),
    lastMessage: conversation.lastMessage,
  });
  return res.json({ message: "Đã xóa tin nhắn" });
};

module.exports = { getMessages, sendMessage, deleteMessage };

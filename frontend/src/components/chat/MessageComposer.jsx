import { useState } from "react";
import { Tooltip, Modal, Input } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  PictureOutlined,
} from "@ant-design/icons";

const COMMON_EMOJIS = [
  "😊",
  "😂",
  "❤️",
  "👍",
  "🔥",
  "🎉",
  "👏",
  "😍",
  "🙏",
  "✨",
  "😎",
  "🥳",
];

export const MessageComposer = ({ onSendMessage, disabled }) => {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUrlModal, setImageUrlModal] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState("");

  const handleSend = async () => {
    if (!content.trim() && !imgUrlInput.trim()) return;
    try {
      await onSendMessage({
        content: content.trim(),
        imgUrl: imgUrlInput.trim(),
      });
      setContent("");
      setImgUrlInput("");
    } catch {
      // Keep the draft so it can be retried after a failed send.
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
  };

  return (
    <div className="chat-composer">
      {showEmojiPicker && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 12px",
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: 12,
            marginBottom: 8,
            boxShadow: "var(--shadow-md)",
            flexWrap: "wrap",
          }}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <span
              key={emoji}
              onClick={() => addEmoji(emoji)}
              style={{
                fontSize: 20,
                cursor: "pointer",
                padding: "2px 4px",
                userSelect: "none",
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}

      {imgUrlInput && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "#EFF6FF",
            borderRadius: 8,
            marginBottom: 8,
            fontSize: 12,
            color: "var(--primary)",
          }}
        >
          <span>Ảnh đính kèm: {imgUrlInput.slice(0, 40)}...</span>
          <button
            onClick={() => setImgUrlInput("")}
            style={{ color: "var(--danger)", fontWeight: "bold" }}
          >
            ✕ Xóa
          </button>
        </div>
      )}

      <div className="composer-box">
        <Tooltip title="Chèn Emoji">
          <button
            type="button"
            className="action-btn"
            style={{ width: 28, height: 28, color: "var(--text-secondary)" }}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={disabled}
          >
            <SmileOutlined />
          </button>
        </Tooltip>

        <Tooltip title="Đính kèm liên kết ảnh">
          <button
            type="button"
            className="action-btn"
            style={{ width: 28, height: 28, color: "var(--text-secondary)" }}
            onClick={() => setImageUrlModal(true)}
            disabled={disabled}
          >
            <PictureOutlined />
          </button>
        </Tooltip>

        <input
          type="text"
          className="composer-input"
          placeholder={
            disabled
              ? "Chọn cuộc trò chuyện để bắt đầu nhắn tin"
              : "Nhập tin nhắn... (Enter để gửi)"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          disabled={disabled || (!content.trim() && !imgUrlInput.trim())}
        >
          <SendOutlined />
        </button>
      </div>

      <Modal
        title="Gửi hình ảnh qua URL"
        open={imageUrlModal}
        onOk={() => setImageUrlModal(false)}
        onCancel={() => {
          setImgUrlInput("");
          setImageUrlModal(false);
        }}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 8,
          }}
        >
          Nhập URL hình ảnh (JPEG, PNG, GIF, WebP):
        </p>
        <Input
          placeholder="https://example.com/image.jpg"
          value={imgUrlInput}
          onChange={(e) => setImgUrlInput(e.target.value)}
        />
      </Modal>
    </div>
  );
};

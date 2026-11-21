import { useEffect, useState } from "react";
import { Tooltip, Modal, Input, Upload, message } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  PictureOutlined,
  LinkOutlined,
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MessageComposer = ({ onSendMessage, disabled }) => {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUrlModal, setImageUrlModal] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const canSend = Boolean(content.trim() || imgUrlInput.trim() || imageFile);

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await onSendMessage({
        content: content.trim(),
        imgUrl: imgUrlInput.trim(),
        imageFile: imageFile || undefined,
      });
      setContent("");
      setImgUrlInput("");
      setImageFile(null);
    } catch {
      // Keep the draft so it can be retried after a failed send.
    }
  };

  const handlePickImage = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      message.error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP!");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      message.error("Ảnh tối đa 5MB!");
      return false;
    }
    setImageFile(file);
    return false;
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

      {imageFile && (
        <div className="composer-attachment">
          <img
            src={imagePreview}
            alt={imageFile.name}
            className="composer-attachment-thumb"
          />
          <span className="composer-attachment-name">{imageFile.name}</span>
          <button
            type="button"
            className="composer-attachment-remove"
            onClick={() => setImageFile(null)}
          >
            ✕ Xóa
          </button>
        </div>
      )}

      {imgUrlInput && (
        <div className="composer-attachment">
          <LinkOutlined />
          <span className="composer-attachment-name">
            Ảnh đính kèm: {imgUrlInput}
          </span>
          <button
            type="button"
            className="composer-attachment-remove"
            onClick={() => setImgUrlInput("")}
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

        <Upload
          accept="image/jpeg,image/png,image/webp"
          showUploadList={false}
          beforeUpload={handlePickImage}
          disabled={disabled}
          multiple={false}
        >
          <Tooltip title="Gửi ảnh từ máy">
            <button
              type="button"
              className="action-btn"
              style={{ width: 28, height: 28, color: "var(--text-secondary)" }}
              disabled={disabled}
            >
              <PictureOutlined />
            </button>
          </Tooltip>
        </Upload>

        <Tooltip title="Đính kèm liên kết ảnh">
          <button
            type="button"
            className="action-btn"
            style={{ width: 28, height: 28, color: "var(--text-secondary)" }}
            onClick={() => setImageUrlModal(true)}
            disabled={disabled}
          >
            <LinkOutlined />
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
          disabled={disabled || !canSend}
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

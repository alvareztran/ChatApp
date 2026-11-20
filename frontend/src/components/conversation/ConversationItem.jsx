import { UserAvatar } from '../common/UserAvatar';

export const ConversationItem = ({
  conversation,
  currentUserId,
  isActive,
  onClick,
}) => {
  // Determine display name and avatar for direct or group
  let title = conversation.name;
  let otherParticipant = null;

  if (conversation.type === 'direct') {
    otherParticipant = conversation.participants?.find(
      (p) => (p._id || p) !== currentUserId
    );
    title = otherParticipant?.displayName || otherParticipant?.username || 'Người dùng';
  } else if (!title) {
    title = conversation.participants?.map((p) => p.displayName || p.username).join(', ') || 'Nhóm';
  }

  // Format last message
  const lastMessage = conversation.lastMessage;
  let snippet = 'Bắt đầu cuộc trò chuyện...';

  if (lastMessage) {
    const isMe = (lastMessage.sender?._id || lastMessage.sender) === currentUserId;
    const prefix = isMe ? 'Bạn: ' : '';
    if (lastMessage.content) {
      snippet = `${prefix}${lastMessage.content}`;
    } else if (lastMessage.imgUrl) {
      snippet = `${prefix}[Hình ảnh]`;
    }
  }

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const updatedAt = conversation.updatedAt || conversation.createdAt;

  return (
    <div
      className={`conv-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <UserAvatar
        user={conversation.type === 'direct' ? otherParticipant : { displayName: title }}
        size={44}
        showOnline={conversation.type === 'direct'}
        isOnline={true}
      />

      <div className="conv-meta">
        <div className="conv-top-row">
          <span className="conv-name">{title}</span>
          <span className="conv-time">{formatTime(updatedAt)}</span>
        </div>

        <div className="conv-bottom-row">
          <span className="conv-snippet">{snippet}</span>
        </div>
      </div>
    </div>
  );
};

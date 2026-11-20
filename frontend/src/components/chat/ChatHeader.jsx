import { UserAvatar } from '../common/UserAvatar';
import { Tooltip, Dropdown } from 'antd';
import {
  PhoneOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

export const ChatHeader = ({
  conversation,
  currentUserId,
  onBack,
  onDeleteConversation,
}) => {
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

  const menuItems = [
    {
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />,
      label: 'Xóa cuộc trò chuyện',
      onClick: onDeleteConversation,
    },
  ];

  return (
    <div className="chat-header">
      <div className="chat-user-info">
        {onBack && (
          <button className="action-btn" onClick={onBack} style={{ marginRight: 4 }}>
            <ArrowLeftOutlined />
          </button>
        )}

        <UserAvatar
          user={conversation.type === 'direct' ? otherParticipant : { displayName: title }}
          size={40}
          showOnline={conversation.type === 'direct'}
          isOnline={true}
        />

        <div className="chat-user-text">
          <h3>{title}</h3>
          <div className="chat-user-status">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <span>Đang hoạt động</span>
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        <Tooltip title="Cuộc gọi thoại (Tính năng đang phát triển)">
          <button className="action-btn">
            <PhoneOutlined />
          </button>
        </Tooltip>

        <Tooltip title="Cuộc gọi video (Tính năng đang phát triển)">
          <button className="action-btn">
            <VideoCameraOutlined />
          </button>
        </Tooltip>

        <Tooltip title="Tìm tin nhắn">
          <button className="action-btn">
            <SearchOutlined />
          </button>
        </Tooltip>

        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button className="action-btn">
            <MoreOutlined />
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

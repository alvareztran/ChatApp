import { useState } from 'react';
import { UserAvatar } from '../common/UserAvatar';
import { GroupMembersModal } from './GroupMembersModal';
import { useSocket } from '../../contexts/SocketContext';
import { Tooltip, Dropdown } from 'antd';
import {
  PhoneOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  TeamOutlined
} from '@ant-design/icons';

export const ChatHeader = ({
  conversation,
  currentUserId,
  onBack,
  onDeleteConversation,
}) => {
  const [membersOpen, setMembersOpen] = useState(false);
  const { isOnline } = useSocket();
  const isGroup = conversation.type === 'group';
  const memberCount = conversation.participants?.length || 0;

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

  const otherUserId = otherParticipant?._id || otherParticipant;
  const otherOnline = !isGroup && isOnline(otherUserId);

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
          isOnline={otherOnline}
        />

        <div
          className="chat-user-text"
          onClick={isGroup ? () => setMembersOpen(true) : undefined}
          style={isGroup ? { cursor: 'pointer' } : undefined}
        >
          <h3>{title}</h3>
          {isGroup ? (
            <div className="chat-user-status member-count">
              <span>{memberCount} thành viên</span>
            </div>
          ) : (
            <div className="chat-user-status">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: otherOnline ? 'var(--success)' : '#94A3B8' }} />
              <span>{otherOnline ? 'Đang hoạt động' : 'Không hoạt động'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-header-actions">
        {isGroup && (
          <Tooltip title="Xem thành viên nhóm">
            <button className="action-btn" onClick={() => setMembersOpen(true)}>
              <TeamOutlined />
            </button>
          </Tooltip>
        )}
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

      {isGroup && (
        <GroupMembersModal
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

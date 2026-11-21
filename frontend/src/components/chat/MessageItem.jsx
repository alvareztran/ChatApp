import { UserAvatar } from '../common/UserAvatar';
import { Dropdown } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { assetUrl } from '../../utils/assetUrl';

export const MessageItem = ({ message, isMine, onDeleteMessage }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const menuItems = [
    {
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />,
      label: 'Xóa tin nhắn này',
      onClick: () => onDeleteMessage(message._id),
    },
  ];

  return (
    <div className={`message-row ${isMine ? 'sent' : 'received'}`}>
      {!isMine && (
        <UserAvatar user={message.sender} size={32} />
      )}

      <div>
        {!isMine && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, marginLeft: 4 }}>
            {message.sender?.displayName || message.sender?.username}
          </div>
        )}

        <Dropdown
          menu={isMine ? { items: menuItems } : undefined}
          trigger={isMine ? ['contextMenu'] : []}
        >
          <div className="msg-bubble">
            {message.content && <div>{message.content}</div>}
            {message.imgUrl && (
              <img
                src={assetUrl(message.imgUrl)}
                alt="Attachment"
                className="msg-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="msg-time">
              <span>{formatTime(message.createdAt)}</span>
              {isMine && <span>✓✓</span>}
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

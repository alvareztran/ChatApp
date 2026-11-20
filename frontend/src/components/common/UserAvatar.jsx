import { Avatar } from 'antd';

export const UserAvatar = ({ user, size = 42, showOnline = false, isOnline = true }) => {
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const name = user?.displayName || user?.username || 'User';

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={name}
          className="avatar-img"
          style={{ width: size, height: size }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <Avatar
          style={{
            backgroundColor: '#1677FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: size * 0.4,
            width: size,
            height: size,
            lineHeight: `${size}px`,
          }}
        >
          {getInitial(name)}
        </Avatar>
      )}

      {showOnline && (
        <span
          className="online-dot"
          style={{ backgroundColor: isOnline ? 'var(--success)' : '#94A3B8' }}
        />
      )}
    </div>
  );
};

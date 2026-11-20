import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { friendRequestService } from '../../services/friendRequestService';
import { Tooltip, Modal, Avatar } from 'antd';
import {
  MessageOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

export const NavigationSidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);

  const fetchBadge = async () => {
    try {
      const requests = await friendRequestService.getReceivedRequests();
      if (Array.isArray(requests)) {
        setRequestCount(requests.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBadge();
    const interval = setInterval(fetchBadge, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Đăng xuất khỏi Chattie?',
      icon: <ExclamationCircleOutlined style={{ color: 'var(--danger)' }} />,
      content: 'Bạn sẽ cần đăng nhập lại để tiếp tục nhắn tin.',
      okText: 'Đăng xuất',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        await logout();
        navigate('/login');
      },
    });
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <aside className="nav-sidebar">
      <div className="nav-top">
        <Tooltip title="Chattie" placement="right">
          <div className="nav-logo" onClick={() => navigate('/chat')}>
            <img src="/logo.svg" alt="Chattie" />
          </div>
        </Tooltip>

        <Tooltip title="Hồ sơ cá nhân" placement="right">
          <div className="nav-avatar-btn" onClick={() => navigate('/profile')}>
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.displayName} />
            ) : (
              <Avatar
                style={{ backgroundColor: 'var(--primary)', color: '#fff', width: '100%', height: '100%', lineHeight: '36px' }}
              >
                {getInitial(currentUser?.displayName || currentUser?.username)}
              </Avatar>
            )}
          </div>
        </Tooltip>

        <div style={{ height: '8px' }} />

        <Tooltip title="Tin nhắn" placement="right">
          <NavLink
            to="/chat"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <MessageOutlined />
          </NavLink>
        </Tooltip>

        <Tooltip title="Danh bạ bạn bè" placement="right">
          <NavLink
            to="/friends"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <TeamOutlined />
          </NavLink>
        </Tooltip>

        <Tooltip title="Lời mời kết bạn" placement="right">
          <NavLink
            to="/requests"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <UsergroupAddOutlined />
            {requestCount > 0 && <span className="nav-badge">{requestCount > 9 ? '9+' : requestCount}</span>}
          </NavLink>
        </Tooltip>

        <Tooltip title="Tìm bạn mới" placement="right">
          <NavLink
            to="/search"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <SearchOutlined />
          </NavLink>
        </Tooltip>
      </div>

      <div className="nav-bottom">
        <Tooltip title="Cá nhân" placement="right">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <UserOutlined />
          </NavLink>
        </Tooltip>

        <Tooltip title="Đăng xuất" placement="right">
          <button
            className="nav-item"
            style={{ color: 'var(--danger)' }}
            onClick={handleLogout}
          >
            <LogoutOutlined />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

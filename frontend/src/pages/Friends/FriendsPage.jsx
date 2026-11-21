import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../../services/friendService';
import { conversationService } from '../../services/conversationService';
import { useSocket } from '../../contexts/SocketContext';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Input, Button, Modal, Spin, Empty, message } from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
  UserDeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

export const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isOnline } = useSocket();

  const fetchFriends = async () => {
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách bạn bè!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleStartChat = async (userId) => {
    try {
      const res = await conversationService.createConversation({
        type: 'direct',
        participants: [userId],
      });
      const conversation = res.conversation || res;
      navigate(`/chat/${conversation._id}`);
    } catch (err) {
      console.error(err);
      message.error('Không thể mở cuộc trò chuyện!');
    }
  };

  const handleRemoveFriend = (friendshipId, friendName) => {
    Modal.confirm({
      title: `Hủy kết bạn với ${friendName}?`,
      icon: <ExclamationCircleOutlined style={{ color: 'var(--danger)' }} />,
      content: 'Bạn sẽ không còn là bạn bè của nhau nữa.',
      okText: 'Hủy kết bạn',
      okType: 'danger',
      cancelText: 'Giữ lại',
      onOk: async () => {
        try {
          await friendService.deleteFriend(friendshipId);
          message.success('Đã hủy kết bạn!');
          setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
        } catch (err) {
          console.error(err);
          message.error('Thao tác thất bại!');
        }
      },
    });
  };

  const filteredFriends = friends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const user = f.user;
    return (
      user?.displayName?.toLowerCase().includes(q) ||
      user?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '32px 40px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Danh sách bạn bè ({friends.length})
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              Quản lý những người bạn đã kết nối trên Chattie
            </p>
          </div>

          <Button
            type="primary"
            onClick={() => navigate('/search')}
            style={{ borderRadius: 8, height: 40, backgroundColor: 'var(--primary)' }}
          >
            + Thêm bạn mới
          </Button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Tìm bạn theo tên hoặc username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="large"
            style={{ borderRadius: 12, background: 'var(--surface)' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : filteredFriends.length === 0 ? (
          <div style={{ background: 'var(--surface)', padding: 60, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
            <Empty
              description={searchQuery ? 'Không tìm thấy bạn bè nào khớp kết quả' : 'Chưa có bạn bè nào'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {!searchQuery && (
                <Button type="primary" onClick={() => navigate('/search')} style={{ backgroundColor: 'var(--primary)', marginTop: 8 }}>
                  Khám phá bạn bè ngay
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {filteredFriends.map((f) => {
              const u = f.user;
              return (
                <div
                  key={f.friendshipId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--surface)',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <UserAvatar user={u} size={48} showOnline={true} isOnline={isOnline(u?._id)} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u?.displayName}
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                        @{u?.username}
                      </p>
                      {u?.bio && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<MessageOutlined />}
                      onClick={() => handleStartChat(u?._id)}
                      style={{ backgroundColor: 'var(--primary)' }}
                      title="Nhắn tin"
                    />
                    <Button
                      danger
                      shape="circle"
                      icon={<UserDeleteOutlined />}
                      onClick={() => handleRemoveFriend(f.friendshipId, u?.displayName)}
                      title="Hủy kết bạn"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

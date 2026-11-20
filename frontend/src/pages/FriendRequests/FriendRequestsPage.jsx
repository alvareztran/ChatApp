import { useState, useEffect } from 'react';
import { friendRequestService } from '../../services/friendRequestService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Button, Spin, Empty, message, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchRequests = async () => {
    try {
      const data = await friendRequestService.getReceivedRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lời mời kết bạn!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    setActionId(requestId);
    try {
      await friendRequestService.acceptFriendRequest(requestId);
      message.success('Đã chấp nhận lời mời kết bạn!');
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error(err);
      message.error('Thao tác chấp nhận thất bại!');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionId(requestId);
    try {
      await friendRequestService.rejectFriendRequest(requestId);
      message.info('Đã từ chối lời mời.');
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error(err);
      message.error('Thao tác từ chối thất bại!');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '32px 40px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Lời mời kết bạn đã nhận ({requests.length})
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Xem xét và phản hồi các yêu cầu kết nối từ người dùng khác
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : requests.length === 0 ? (
          <div style={{ background: 'var(--surface)', padding: 60, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
            <Empty
              description="Hiện không có lời mời kết bạn nào đang chờ phản hồi"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map((req) => {
              const sender = req.from;
              return (
                <div
                  key={req._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    background: 'var(--surface)',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <UserAvatar user={sender} size={52} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sender?.displayName}
                        </h4>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          @{sender?.username}
                        </span>
                      </div>

                      {req.message && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{req.message}"
                        </p>
                      )}

                      <div style={{ marginTop: 6 }}>
                        <Tag color="blue">{formatDate(req.createdAt)}</Tag>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      loading={actionId === req._id}
                      onClick={() => handleAccept(req._id)}
                      style={{ borderRadius: 8, height: 38, backgroundColor: 'var(--primary)' }}
                    >
                      Đồng ý
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      disabled={actionId === req._id}
                      onClick={() => handleReject(req._id)}
                      style={{ borderRadius: 8, height: 38 }}
                    >
                      Từ chối
                    </Button>
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

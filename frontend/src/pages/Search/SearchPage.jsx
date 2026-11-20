import { useState } from 'react';
import { userService } from '../../services/userService';
import { friendRequestService } from '../../services/friendRequestService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Input, Button, Spin, Empty, message, Modal } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';

export const SearchPage = () => {
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Friend request message modal
  const [targetUser, setTargetUser] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await userService.searchUsers(keyword.trim());
      setUsers(data);
    } catch (err) {
      console.error(err);
      message.error('Tìm kiếm thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!targetUser) return;
    setSending(true);
    try {
      await friendRequestService.sendFriendRequest(targetUser._id, requestMsg.trim());
      message.success(`Đã gửi lời mời kết bạn đến ${targetUser.displayName}!`);
      setTargetUser(null);
      setRequestMsg('');
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      message.error(
        status === 409
          ? 'Bạn đã gửi lời mời kết bạn cho người này rồi!'
          : status === 400
            ? 'Không thể gửi lời mời kết bạn đến người này!'
            : 'Không thể gửi lời mời kết bạn!'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '32px 40px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Khám phá & Tìm kiếm người dùng
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Tìm kiếm bạn bè theo tên người dùng hoặc tên hiển thị để mở rộng kết nối
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Nhập tên đăng nhập hoặc tên hiển thị..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            size="large"
            style={{ borderRadius: 12, background: 'var(--surface)' }}
          />
          <Button
            type="primary"
            onClick={handleSearch}
            loading={loading}
            style={{ height: 40, borderRadius: 12, padding: '0 24px', backgroundColor: 'var(--primary)', fontWeight: 600 }}
          >
            Tìm kiếm
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : searched && users.length === 0 ? (
          <div style={{ background: 'var(--surface)', padding: 60, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
            <Empty description={`Không tìm thấy người dùng nào phù hợp với từ khóa "${keyword}"`} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {users.map((u) => (
              <div
                key={u._id}
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
                  <UserAvatar user={u} size={50} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.displayName}
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                      @{u.username}
                    </p>
                    {u.bio && (
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {u.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setTargetUser(u)}
                  style={{ borderRadius: 8, height: 38, backgroundColor: 'var(--primary)' }}
                >
                  Kết bạn
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={`Gửi lời mời kết bạn tới ${targetUser?.displayName}`}
        open={Boolean(targetUser)}
        onOk={handleSendRequest}
        confirmLoading={sending}
        onCancel={() => {
          setTargetUser(null);
          setRequestMsg('');
        }}
        okText="Gửi lời mời"
        cancelText="Hủy"
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, marginTop: 12 }}>
          Tin nhắn đính kèm (tùy chọn):
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Xin chào, mình kết bạn nhé!"
          value={requestMsg}
          onChange={(e) => setRequestMsg(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

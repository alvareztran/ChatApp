import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Form, Input, Button, Card, Upload, message, Divider } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined,
  LoadingOutlined
} from '@ant-design/icons';

export const ProfilePage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP!');
      return Upload.LIST_END;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error('Ảnh đại diện tối đa 2MB!');
      return Upload.LIST_END;
    }

    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      if (res.user) updateUserProfile(res.user);
      message.success('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Tải ảnh đại diện thất bại!');
    } finally {
      setAvatarUploading(false);
    }
    return Upload.LIST_END;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await userService.updateMe({
        displayName: values.displayName,
        bio: values.bio,
        phone: values.phone,
      });

      if (res.user) {
        updateUserProfile(res.user);
      }
      message.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '32px 40px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Hồ sơ cá nhân
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Quản lý thông tin tài khoản và hình ảnh đại diện của bạn
          </p>
        </div>

        <Card
          style={{
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          styles={{ body: { padding: '32px 28px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <Upload
              accept="image/jpeg,image/png,image/webp"
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              disabled={avatarUploading}
            >
              <div className="avatar-upload">
                <UserAvatar user={currentUser} size={72} />
                <span className="avatar-upload-overlay">
                  {avatarUploading ? <LoadingOutlined /> : <CameraOutlined />}
                </span>
              </div>
            </Upload>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser?.displayName}
              </h2>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                @{currentUser?.username}
              </p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
                Nhấp vào ảnh để thay đổi · JPG, PNG, WebP · tối đa 2MB
              </p>
            </div>
          </div>

          <Divider />

          <Form
            layout="vertical"
            initialValues={{
              displayName: currentUser?.displayName || '',
              username: currentUser?.username || '',
              email: currentUser?.email || '',
              bio: currentUser?.bio || '',
              phone: currentUser?.phone || '',
            }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="displayName"
              label={<span style={{ fontWeight: 500 }}>Tên hiển thị</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập tên hiển thị!' },
                { max: 100, message: 'Tối đa 100 ký tự!' }
              ]}
            >
              <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>

            <Form.Item
              name="username"
              label={<span style={{ fontWeight: 500 }}>Tên đăng nhập</span>}
            >
              <Input disabled prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 500 }}>Địa chỉ Email</span>}
            >
              <Input disabled prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="0912345678"
              />
            </Form.Item>

            <Form.Item
              name="bio"
              label={<span style={{ fontWeight: 500 }}>Tiểu sử (Bio)</span>}
              rules={[{ max: 500, message: 'Tối đa 500 ký tự!' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Giới thiệu đôi nét về bản thân bạn..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  backgroundColor: 'var(--primary)'
                }}
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

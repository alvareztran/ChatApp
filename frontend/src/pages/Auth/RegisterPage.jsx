import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined } from '@ant-design/icons';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });
      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F5F8FF 0%, #E6F4FF 100%)',
      padding: '16px',
      overflow: 'hidden'
    }}>
      <Card
        style={{
          width: 500,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(22, 119, 255, 0.1), 0 8px 10px -6px rgba(22, 119, 255, 0.1)',
          border: '1px solid var(--border)'
        }}
        styles={{ body: { padding: '14px 24px', overflowY: 'auto', flex: 1, minHeight: 0 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/logo.png" alt="Chattie" style={{ width: 108, height: 'auto', marginBottom: 3 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Tạo tài khoản mới
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2, marginBottom: 0 }}>
            Gia nhập cộng đồng nhắn tin Chattie ngay hôm nay
          </p>
        </div>

        <Form
          className="compact-form"
          name="register_form"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          size="large"
        >
          <div className="register-grid">
          <Form.Item
            name="displayName"
            label={<span style={{ fontWeight: 500 }}>Họ và tên hiển thị</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập tên hiển thị!' },
              { max: 100, message: 'Tối đa 100 ký tự!' }
            ]}
          >
            <Input
              prefix={<SmileOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </Form.Item>

          <Form.Item
            name="username"
            label={<span style={{ fontWeight: 500 }}>Tên đăng nhập (Username)</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập username!' },
              { max: 32, message: 'Tối đa 32 ký tự!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Ví dụ: anguyen123"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 500 }}>Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
            />
          </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 10 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                backgroundColor: 'var(--primary)'
              }}
            >
              Đăng ký tài khoản
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};

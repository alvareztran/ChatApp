const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const createSocketServer = require('./socket');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const friendRoute = require('./routes/friendRoute');
const friendRequestRoute = require('./routes/friendRequestRoute');
const conversationRoute = require('./routes/conversationRoute');
const messageRoute = require('./routes/messageRoute');

dotenv.config();

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
  : process.env.NODE_ENV === 'production'
    ? []
    : true;

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const port = process.env.PORT || 3000;

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/friend_requests', friendRequestRoute);
app.use('/api/conversations', conversationRoute);
app.use('/api/messages', messageRoute);

app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy đường dẫn.' }));
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message = status >= 500 ? 'Lỗi máy chủ, vui lòng thử lại sau.' : error.message;
  if (error.code === 11000) {
    status = 409;
    message = 'Tên đăng nhập hoặc email đã tồn tại.';
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    status = 400;
    message = 'Dữ liệu không hợp lệ.';
  }
  if (status >= 500) console.error(error);
  return res.status(status).json({ message });
});

const start = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be configured in production');
  }
  await connectDB();
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);
  app.set('io', io);
  httpServer.listen(port, () => console.log(`Server listening on port ${port}`));
};

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

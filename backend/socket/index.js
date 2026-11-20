const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const { userRoom } = require('../utils/socket');

const createSocketServer = (httpServer) => {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
    : process.env.NODE_ENV === 'production'
      ? []
      : true;

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (typeof token !== 'string' || !token)
      return next(new Error('Access token required'));
    try {
      const payload = verifyAccessToken(token);
      if (!payload || typeof payload === 'string' || !payload.sub)
        return next(new Error('Invalid access token'));
      socket.userId = payload.sub;
      return next();
    } catch (_err) {
      return next(new Error('Invalid or expired access token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.userId));
  });

  return io;
};

module.exports = createSocketServer;

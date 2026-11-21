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

  const onlineCounts = new Map();

  io.on('connection', (socket) => {
    const { userId } = socket;
    socket.join(userRoom(userId));

    const count = (onlineCounts.get(userId) || 0) + 1;
    onlineCounts.set(userId, count);
    if (count === 1) io.emit('presence:update', { userId, online: true });
    socket.emit('presence:list', [...onlineCounts.keys()]);

    socket.on('presence:sync', () => {
      socket.emit('presence:list', [...onlineCounts.keys()]);
    });

    socket.on('disconnect', () => {
      const remaining = (onlineCounts.get(userId) || 1) - 1;
      if (remaining > 0) {
        onlineCounts.set(userId, remaining);
        return;
      }
      onlineCounts.delete(userId);
      io.emit('presence:update', { userId, online: false });
    });
  });

  return io;
};

module.exports = createSocketServer;

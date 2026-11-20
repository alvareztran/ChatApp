const { verifyAccessToken } = require('../utils/tokens');

const authMiddleware = (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) return res.status(401).json({ message: 'Cần có mã truy cập.' });

  try {
    const payload = verifyAccessToken(match[1]);
    if (!payload || typeof payload === 'string' || !payload.sub)
      return res.status(401).json({ message: 'Mã truy cập không hợp lệ.' });
    req.userId = payload.sub;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Mã truy cập không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = authMiddleware;

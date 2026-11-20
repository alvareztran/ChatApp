const { verifyAccessToken } = require('../utils/tokens');

const authMiddleware = (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) return res.status(401).json({ message: 'Access token is required' });

  try {
    const payload = verifyAccessToken(match[1]);
    if (!payload || typeof payload === 'string' || !payload.sub)
      return res.status(401).json({ message: 'Invalid access token' });
    req.userId = payload.sub;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

module.exports = authMiddleware;

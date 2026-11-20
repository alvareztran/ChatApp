const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE = 'refreshToken';

const getSecrets = () => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be configured');
  }
  return {
    access: process.env.JWT_SECRET,
    refresh: process.env.REFRESH_TOKEN_SECRET,
  };
};

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, getSecrets().access, { expiresIn: ACCESS_TOKEN_TTL });

const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, jti: crypto.randomUUID() }, getSecrets().refresh, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

const verifyAccessToken = (token) => jwt.verify(token, getSecrets().access);
const verifyRefreshToken = (token) => jwt.verify(token, getSecrets().refresh);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_MAX_AGE,
});

module.exports = {
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const DEFAULT_ACCESS_TTL = "15m";
const DEFAULT_REFRESH_TTL = "7d";
const DEFAULT_REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE = "refreshToken";

const accessTtl = () =>
  (process.env.ACCESS_TOKEN_TTL || "").trim() || DEFAULT_ACCESS_TTL;
const refreshTtl = () =>
  (process.env.REFRESH_TOKEN_TTL || "").trim() || DEFAULT_REFRESH_TTL;

const parseDurationMs = (value) => {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value);
  if (!match) return null;
  const unitMs = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[match[2].toLowerCase()];
  return Number(match[1]) * unitMs;
};

const refreshMaxAge = () => parseDurationMs(refreshTtl()) ?? DEFAULT_REFRESH_MAX_AGE;

const getSecrets = () => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET must be configured");
  }
  return {
    access: process.env.JWT_SECRET,
    refresh: process.env.REFRESH_TOKEN_SECRET,
  };
};

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, getSecrets().access, {
    expiresIn: accessTtl(),
  });

const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, jti: crypto.randomUUID() }, getSecrets().refresh, {
    expiresIn: refreshTtl(),
  });

const verifyAccessToken = (token) => jwt.verify(token, getSecrets().access);
const verifyRefreshToken = (token) => jwt.verify(token, getSecrets().refresh);
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: refreshMaxAge(),
});

module.exports = {
  REFRESH_COOKIE,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};

const jwt = require('jsonwebtoken');
const {
  createRefreshToken,
  verifyAndRotateRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
} = require('../db/refreshTokens');

const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefreshToken = async (userId) => createRefreshToken(userId);

const verifyRefreshToken = async (token) => verifyAndRotateRefreshToken(token);

const shouldUseSecureCookies = (req) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return false;

  const host = req?.headers?.host || '';
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (isLocalHost) return false;

  return true;
};

const setAuthCookies = (req, res, accessToken, refreshToken, options = {}) => {
  const isProd = shouldUseSecureCookies(req);
  const { persistent = false } = options;
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Lax',
    secure: isProd,
  };

  const accessCookie = {
    ...cookieOptions,
    ...(persistent ? { maxAge: 15 * 60 * 1000 } : {}),
  };

  const refreshCookie = {
    ...cookieOptions,
    ...(persistent ? { maxAge: 2 * 60 * 60 * 1000 } : {}),
    path: '/api/auth/refresh',
  };

  res.cookie('accessToken', accessToken, accessCookie);
  res.cookie('refreshToken', refreshToken, refreshCookie);
};

const clearAuthCookies = (req, res) => {
  const isProd = shouldUseSecureCookies(req);
  const base = {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Lax',
    secure:   isProd,
  };
  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', { ...base, path: '/api/auth/refresh' });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
};

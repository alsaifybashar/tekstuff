const jwt = require('jsonwebtoken');

/**
 * Generate access and refresh tokens
 * @param {number} userId - User ID
 * @returns {object} - Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {object|null} - Decoded token or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Verify access token
 * @param {string} token - Access token to verify
 * @returns {object|null} - Decoded token or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Access token verification failed:', error.message);
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyRefreshToken,
  verifyAccessToken
};
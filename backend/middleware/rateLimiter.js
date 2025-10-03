const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // requests per windowMs
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(options.windowMs / 1000) || 900
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

const createAuthRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
      });
    }
  });
};

const createGraphQLRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 GraphQL requests per 15 minutes
    message: 'GraphQL rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  createRateLimiter,
  createAuthRateLimiter,
  createGraphQLRateLimiter
};
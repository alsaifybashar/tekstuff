import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// General API rate limiting
export default rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom key generator to handle proxies
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  
  // Skip successful requests for certain endpoints
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    });
  }
});

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes.',
      retryAfter: 900
    });
  }
});

// Lenient rate limiting for product browsing
export const browsingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for browsing
  
  message: {
    error: 'Too many requests, please slow down.',
    retryAfter: 60
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    // Skip for cached responses
    return req.method === 'GET' && req.headers['if-none-match'];
  }
});

// Very strict rate limiting for admin endpoints
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per 5 minutes
  
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: 300
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.error(`Admin rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, User: ${req.user?.id || 'Unknown'}`);
    res.status(429).json({
      error: 'Too many admin requests',
      message: 'Please try again in 5 minutes.',
      retryAfter: 300
    });
  }
});
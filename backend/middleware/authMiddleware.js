const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');
const { logAuditEvent } = require('../utils/auditLogger');

// JWT token verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, role, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    await logAuditEvent(null, 'auth_error', 'token', null, req.ip, req.get('user-agent'), { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Admin role verification middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logAuditEvent(req.user?.id, 'unauthorized_admin_access', 'admin_resource', null, req.ip, req.get('user-agent'));
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await query(
        'SELECT id, email, role, is_verified FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_verified) {
        req.user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          role: userResult.rows[0].role
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 attempts per windowMs
  message: 'Too many attempts for this operation, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Account lockout middleware
const checkAccountLockout = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    const userResult = await query(
      'SELECT failed_login_attempts, account_locked_until FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Check if account is currently locked
      if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
        const unlockTime = new Date(user.account_locked_until).toISOString();
        return res.status(423).json({
          success: false,
          message: `Account is temporarily locked. Try again after ${unlockTime}`,
          lockoutUntil: unlockTime
        });
      }

      // Reset lockout if time has passed
      if (user.account_locked_until && new Date() >= new Date(user.account_locked_until)) {
        await query(
          'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE email = $1',
          [email.toLowerCase()]
        );
      }
    }

    next();
  } catch (error) {
    console.error('Account lockout check error:', error);
    next(); // Continue even if check fails
  }
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body.csrfToken;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// IP whitelist middleware (for admin operations)
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip in development
    }

    if (!allowedIPs.includes(clientIP)) {
      logAuditEvent(req.user?.id, 'ip_blocked', 'admin_access', null, clientIP, req.get('user-agent'));
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }

    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  sensitiveOperationLimiter,
  checkAccountLockout,
  validateInput,
  csrfProtection,
  ipWhitelist,
  securityHeaders
};
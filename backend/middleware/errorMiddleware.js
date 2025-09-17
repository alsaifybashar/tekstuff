const { logAuditEvent } = require('../utils/auditLogger');

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = async (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Log error details
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Validation Error';
      break;
      
    case 'CastError':
      statusCode = 400;
      message = 'Invalid ID format';
      break;
      
    case 'MongoError':
    case 'DatabaseError':
      if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value';
      } else {
        statusCode = 500;
        message = 'Database error occurred';
      }
      break;
      
    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Invalid token';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token expired';
      break;
      
    case 'MulterError':
      statusCode = 400;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files';
      } else {
        message = 'File upload error';
      }
      break;

    case 'PaymentError':
      statusCode = 402;
      message = 'Payment processing failed';
      break;

    case 'AuthorizationError':
      statusCode = 403;
      message = 'Access denied';
      break;

    case 'RateLimitError':
      statusCode = 429;
      message = 'Too many requests';
      break;

    default:
      // Handle PostgreSQL specific errors
      if (err.code) {
        switch (err.code) {
          case '23505': // unique_violation
            statusCode = 409;
            message = 'Duplicate entry';
            break;
          case '23503': // foreign_key_violation
            statusCode = 400;
            message = 'Invalid reference';
            break;
          case '23502': // not_null_violation
            statusCode = 400;
            message = 'Required field missing';
            break;
          case '42703': // undefined_column
            statusCode = 400;
            message = 'Invalid field';
            break;
          case '42P01': // undefined_table
            statusCode = 500;
            message = 'Database schema error';
            break;
          case '28P01': // invalid_password
            statusCode = 500;
            message = 'Database connection error';
            break;
          default:
            if (process.env.NODE_ENV === 'development') {
              message = `Database error: ${err.message}`;
            } else {
              message = 'Database operation failed';
            }
        }
      }
  }

  // Security: Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Sanitize error messages for production
    const safeBodes = [
      'Validation Error',
      'Invalid ID format',
      'Duplicate field value',
      'Invalid token',
      'Token expired',
      'Access denied',
      'Payment processing failed',
      'File too large',
      'Too many files',
      'File upload error',
      'Too many requests',
      'Duplicate entry',
      'Invalid reference',
      'Required field missing',
      'Invalid field'
    ];

    if (!safeBodes.includes(message) && statusCode >= 500) {
      message = 'Internal server error';
    }
  }

  // Log security-related errors
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    try {
      await logAuditEvent(
        req.user?.id,
        'security_error',
        'error',
        null,
        req.ip,
        req.get('user-agent'),
        {
          errorType: err.name,
          statusCode,
          url: req.originalUrl,
          method: req.method
        }
      );
    } catch (logError) {
      console.error('Failed to log security error:', logError);
    }
  }

  // Rate limiting headers
  if (statusCode === 429) {
    res.set({
      'Retry-After': '900', // 15 minutes
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0'
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: err.name,
        stack: err.stack,
        details: err.details || null
      }
    })
  };

  // Add request ID for tracking
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Add validation details for client
  if (err.name === 'ValidationError' && err.details) {
    errorResponse.validationErrors = err.details;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 402);
    this.name = 'PaymentError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Request timeout middleware
const timeout = (ms = 30000) => (req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    }
  }, ms);

  res.on('finish', () => clearTimeout(timer));
  next();
};

// Request ID middleware for tracking
const requestId = (req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.set('X-Request-ID', req.requestId);
  next();
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      
      // Close database connections, cleanup resources, etc.
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  timeout,
  requestId,
  gracefulShutdown,
  // Custom error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  PaymentError,
  RateLimitError
};
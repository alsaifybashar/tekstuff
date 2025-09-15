import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      body: req.body,
      query: req.query,
      params: req.params
    });

    return next(new ValidationError('Validation failed', formattedErrors));
  }

  next();
};

/**
 * Sanitize and validate common request data
 */
export const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      // Trim whitespace
      req.query[key] = req.query[key].trim();
      
      // Convert empty strings to undefined
      if (req.query[key] === '') {
        req.query[key] = undefined;
      }
      
      // Convert boolean strings
      if (req.query[key] === 'true') req.query[key] = true;
      if (req.query[key] === 'false') req.query[key] = false;
      
      // Convert numeric strings for common parameters
      if (['page', 'limit', 'minPrice', 'maxPrice'].includes(key)) {
        const num = parseFloat(req.query[key]);
        if (!isNaN(num)) {
          req.query[key] = num;
        }
      }
    }
  }

  // Sanitize body data
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }

  next();
};

/**
 * Validate MongoDB ObjectId format
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!mongoIdPattern.test(id)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }
    
    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  // Ensure page is at least 1
  req.query.page = Math.max(1, parseInt(page) || 1);
  
  // Ensure limit is between 1 and 100
  req.query.limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  next();
};

/**
 * Validate and normalize price range
 */
export const validatePriceRange = (req, res, next) => {
  const { minPrice, maxPrice } = req.query;
  
  if (minPrice !== undefined) {
    const min = parseFloat(minPrice);
    if (isNaN(min) || min < 0) {
      return next(new ValidationError('minPrice must be a positive number'));
    }
    req.query.minPrice = min;
  }
  
  if (maxPrice !== undefined) {
    const max = parseFloat(maxPrice);
    if (isNaN(max) || max < 0) {
      return next(new ValidationError('maxPrice must be a positive number'));
    }
    req.query.maxPrice = max;
  }
  
  // Ensure minPrice <= maxPrice
  if (req.query.minPrice && req.query.maxPrice && req.query.minPrice > req.query.maxPrice) {
    return next(new ValidationError('minPrice cannot be greater than maxPrice'));
  }
  
  next();
};

/**
 * Custom validation for file uploads
 */
export const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxSize = 5 * 1024 * 1024, // 5MB
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file) {
      if (required) {
        return next(new ValidationError('File upload is required'));
      }
      return next();
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }

    // Check file size
    if (req.file.size > maxSize) {
      return next(new ValidationError(`File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`));
    }

    next();
  };
};
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * Generate cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} - Secure random string
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure API key
 * @returns {string} - Secure API key
 */
const generateApiKey = () => {
  const prefix = 'ak_';
  const randomPart = crypto.randomBytes(32).toString('hex');
  return prefix + randomPart;
};

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password, saltRounds = 12) => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with score and feedback
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: [],
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      noCommonPatterns: false
    }
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  // Check minimum length
  if (password.length >= 8) {
    result.requirements.minLength = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.requirements.hasUppercase = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.requirements.hasLowercase = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.requirements.hasNumbers = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one number');
  }

  // Check for special characters
  if (/[@$!%*?&]/.test(password)) {
    result.requirements.hasSpecialChars = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Check for common patterns (additional security)
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (!hasCommonPattern) {
    result.requirements.noCommonPatterns = true;
  } else {
    result.feedback.push('Password contains common patterns and may be easily guessed');
    result.score -= 10;
  }

  // Additional bonus for longer passwords
  if (password.length >= 12) {
    result.score += 10;
  }

  // Additional bonus for variety of special characters
  const specialCharCount = (password.match(/[@$!%*?&]/g) || []).length;
  if (specialCharCount >= 2) {
    result.score += 5;
  }

  result.score = Math.max(0, Math.min(100, result.score));
  result.isValid = result.score >= 80;

  return result;
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return validator.escape(input.trim());
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {object} - Validation result
 */
const validateEmail = (email) => {
  const result = {
    isValid: false,
    sanitized: '',
    errors: []
  };

  if (!email) {
    result.errors.push('Email is required');
    return result;
  }

  // Normalize email
  const normalizedEmail = validator.normalizeEmail(email);
  
  if (!normalizedEmail) {
    result.errors.push('Invalid email format');
    return result;
  }

  // Validate email format
  if (!validator.isEmail(normalizedEmail)) {
    result.errors.push('Invalid email format');
    return result;
  }

  // Check for disposable email domains (optional)
  const disposableDomains = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org'
  ];

  const domain = normalizedEmail.split('@')[1];
  if (disposableDomains.includes(domain)) {
    result.errors.push('Disposable email addresses are not allowed');
    return result;
  }

  result.isValid = true;
  result.sanitized = normalizedEmail;
  return result;
};

/**
 * Generate CSRF token
 * @returns {string} - CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} sessionToken - Session token
 * @returns {boolean} - True if valid
 */
const validateCSRFToken = (token, sessionToken) => {
  if (!token || !sessionToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
};

/**
 * Rate limiting helper
 * @param {object} options - Rate limiting options
 * @returns {object} - Rate limiter configuration
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests
    message = 'Too many requests',
    skipSuccessfulRequests = false
  } = options;

  return {
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests
  };
};

/**
 * Generate secure filename for uploads
 * @param {string} originalName - Original filename
 * @returns {string} - Secure filename
 */
const generateSecureFilename = (originalName) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  
  return `${timestamp}_${randomString}.${extension}`;
};

/**
 * Validate file upload
 * @param {object} file - File object
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
  } = options;

  const result = {
    isValid: false,
    errors: []
  };

  if (!file) {
    result.errors.push('No file provided');
    return result;
  }

  // Check file size
  if (file.size > maxSize) {
    result.errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    result.errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  const extension = file.originalname.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    result.errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  // Additional security checks
  if (file.originalname.includes('..') || file.originalname.includes('/')) {
    result.errors.push('Invalid filename');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Mask sensitive data for logging
 * @param {object} data - Data to mask
 * @param {array} sensitiveFields - Fields to mask
 * @returns {object} - Masked data
 */
const maskSensitiveData = (data, sensitiveFields = ['password', 'token', 'secret', 'key']) => {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      const value = masked[field].toString();
      masked[field] = value.length > 4 ? 
        value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2) :
        '*'.repeat(value.length);
    }
  }

  return masked;
};

/**
 * Generate secure session ID
 * @returns {string} - Session ID
 */
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Check if IP address is in allowed range
 * @param {string} ip - IP address to check
 * @param {array} allowedRanges - Array of allowed IP ranges
 * @returns {boolean} - True if IP is allowed
 */
const isIPAllowed = (ip, allowedRanges = []) => {
  if (allowedRanges.length === 0) return true;
  
  // Simple IP validation - in production, use proper CIDR matching
  return allowedRanges.some(range => {
    if (range.includes('/')) {
      // CIDR notation - simplified check
      const [rangeIP] = range.split('/');
      return ip.startsWith(rangeIP.substring(0, rangeIP.lastIndexOf('.')));
    }
    return ip === range;
  });
};

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted text
 */
const encrypt = (text, key = process.env.ENCRYPTION_KEY) => {
  if (!key) throw new Error('Encryption key not provided');
  
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text
 * @param {string} key - Decryption key
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText, key = process.env.ENCRYPTION_KEY) => {
  if (!key) throw new Error('Decryption key not provided');
  
  const algorithm = 'aes-256-gcm';
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  generateSecureToken,
  generateApiKey,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  sanitizeInput,
  validateEmail,
  generateCSRFToken,
  validateCSRFToken,
  createRateLimiter,
  generateSecureFilename,
  validateFileUpload,
  maskSensitiveData,
  generateSessionId,
  isIPAllowed,
  encrypt,
  decrypt
};
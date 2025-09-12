// src/utils/security.js

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Swedish phone number
 */
export function validatePhoneNumber(phone) {
  const phoneRegex = /^(\+46|0)[1-9]\d{7,9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

/**
 * Content Security Policy headers for your app
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.yourdomain.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

/**
 * Secure password validation
 */
export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Minst ${minLength} tecken`);
  }
  if (!hasUpperCase) {
    errors.push('Minst en stor bokstav');
  }
  if (!hasLowerCase) {
    errors.push('Minst en liten bokstav');
  }
  if (!hasNumbers) {
    errors.push('Minst en siffra');
  }
  if (!hasSpecialChar) {
    errors.push('Minst ett specialtecken (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
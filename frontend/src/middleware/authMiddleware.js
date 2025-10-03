const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { AuthenticationError } = require('apollo-server-express');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (next) return next();
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_verified = true',
        [decoded.userId]
      );
      client.release();

      if (result.rows.length === 0) {
        if (next) return next();
        return null;
      }

      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      if (next) return next();
      return req.user;
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      if (next) return next();
      return null;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (next) return next();
    return null;
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  
  if (!roles.includes(req.user.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  next();
};

module.exports = {
  authMiddleware,
  requireAuth,
  requireRole
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
const { generateTokens, verifyRefreshToken } = require('../../utils/tokenUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const { logAuditEvent } = require('../../utils/auditLogger');
const { validateEmail, validatePassword } = require('../../utils/security');
const { UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-express');

const authResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return user;
    },

    verifyToken: async (_, { token }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return !!decoded;
      } catch {
        return false;
      }
    }
  },

  Mutation: {
    register: async (_, { input }, { req }) => {
      const { email, password, firstName, lastName, phone } = input;

      // Validate input
      if (!validateEmail(email)) {
        throw new UserInputError('Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new UserInputError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      try {
        const client = await pool.connect();

        // Check if user already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
          throw new UserInputError('User already exists with this email');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
        const verificationToken = uuidv4();

        // Create user
        const result = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, phone, verification_token) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [email.toLowerCase(), passwordHash, firstName, lastName, phone, verificationToken]
        );

        const user = result.rows[0];
        client.release();

        // Send verification email
        await sendVerificationEmail(email, verificationToken, firstName);

        // Log registration
        await logAuditEvent(
          user.id,
          'user_register',
          'user',
          user.id,
          req.ip,
          req.get('user-agent'),
          { email: email.toLowerCase() }
        );

        return {
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            role: user.role.toUpperCase(),
            isVerified: user.is_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }
        };
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },

    login: async (_, { input }, { req, res }) => {
      const { email, password } = input;

      try {
        const client = await pool.connect();

        // Get user with account lock info
        const result = await client.query(
          `SELECT * FROM users WHERE email = $1`,
          [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
          throw new AuthenticationError('Invalid credentials');
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.account_locked_until && new Date() < user.account_locked_until) {
          throw new ForbiddenError('Account is temporarily locked due to multiple failed login attempts');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
          // Increment failed attempts
          const failedAttempts = user.failed_login_attempts + 1;
          let updateQuery = 'UPDATE users SET failed_login_attempts = $1';
          let params = [failedAttempts, user.id];

          // Lock account after 5 failed attempts
          if (failedAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            updateQuery += ', account_locked_until = $3';
            params = [failedAttempts, lockUntil, user.id];
          }

          updateQuery += ' WHERE id = $2';
          await client.query(updateQuery, params);

          client.release();
          throw new AuthenticationError('Invalid credentials');
        }

        // Reset failed attempts on successful login
        await client.query(
          'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );

        client.release();

        // Check if email is verified
        if (!user.is_verified) {
          throw new ForbiddenError('Please verify your email address before logging in');
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log successful login
        await logAuditEvent(
          user.id,
          'user_login',
          'user',
          user.id,
          req.ip,
          req.get('user-agent')
        );

        return {
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            role: user.role.toUpperCase(),
            isVerified: user.is_verified,
            avatarUrl: user.avatar_url,
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          },
          accessToken,
          refreshToken
        };
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    logout: async (_, __, { req, res, user }) => {
      if (user) {
        await logAuditEvent(
          user.id,
          'user_logout',
          'user',
          user.id,
          req.ip,
          req.get('user-agent')
        );
      }

      res.clearCookie('refreshToken');
      return {
        success: true,
        message: 'Logout successful'
      };
    },

    refreshToken: async (_, { refreshToken }, { req, res }) => {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        client.release();

        if (result.rows.length === 0) {
          throw new AuthenticationError('Invalid refresh token');
        }

        const user = result.rows[0];
        const tokens = generateTokens(user);

        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return {
          success: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        };
      } catch (error) {
        throw new AuthenticationError('Invalid refresh token');
      }
    },

    verifyEmail: async (_, { input }) => {
      const { token } = input;

      try {
        const client = await pool.connect();
        
        const result = await client.query(
          'SELECT * FROM users WHERE verification_token = $1',
          [token]
        );

        if (result.rows.length === 0) {
          throw new UserInputError('Invalid or expired verification token');
        }

        await client.query(
          'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
          [result.rows[0].id]
        );

        client.release();

        return {
          success: true,
          message: 'Email verified successfully'
        };
      } catch (error) {
        throw error;
      }
    },

    forgotPassword: async (_, { input }) => {
      const { email } = input;

      try {
        const client = await pool.connect();
        
        const result = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
          // Don't reveal if email exists
          return {
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
          };
        }

        const user = result.rows[0];
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await client.query(
          'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
          [resetToken, resetExpires, user.id]
        );

        client.release();

        await sendPasswordResetEmail(email, resetToken, user.first_name);

        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        };
      } catch (error) {
        console.error('Forgot password error:', error);
        throw new Error('Failed to process password reset request');
      }
    },

    resetPassword: async (_, { input }) => {
      const { token, password } = input;

      if (!validatePassword(password)) {
        throw new UserInputError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      try {
        const client = await pool.connect();
        
        const result = await client.query(
          'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2',
          [token, new Date()]
        );

        if (result.rows.length === 0) {
          throw new UserInputError('Invalid or expired reset token');
        }

        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

        await client.query(
          'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
          [passwordHash, result.rows[0].id]
        );

        client.release();

        return {
          success: true,
          message: 'Password reset successful'
        };
      } catch (error) {
        throw error;
      }
    },

    changePassword: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to change password');
      }

      const { currentPassword, newPassword } = input;

      if (!validatePassword(newPassword)) {
        throw new UserInputError('New password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      try {
        const client = await pool.connect();
        
        const result = await client.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
        const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

        if (!isValidPassword) {
          throw new AuthenticationError('Current password is incorrect');
        }

        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

        client.release();

        return {
          success: true,
          message: 'Password changed successfully'
        };
      } catch (error) {
        throw error;
      }
    },

    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to update profile');
      }

      const { firstName, lastName, phone } = input;

      try {
        const client = await pool.connect();
        
        const result = await client.query(
          'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), phone = COALESCE($3, phone) WHERE id = $4 RETURNING *',
          [firstName, lastName, phone, user.id]
        );

        client.release();

        const updatedUser = result.rows[0];
        return {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          fullName: `${updatedUser.first_name} ${updatedUser.last_name}`,
          phone: updatedUser.phone,
          role: updatedUser.role.toUpperCase(),
          isVerified: updatedUser.is_verified,
          avatarUrl: updatedUser.avatar_url,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        };
      } catch (error) {
        throw error;
      }
    }
  }
};

module.exports = authResolvers;
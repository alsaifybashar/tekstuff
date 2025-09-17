const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const { logAuditEvent } = require('../utils/auditLogger');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenUtils');
const validator = require('validator');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Input validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await logAuditEvent(null, 'registration_attempt_existing_email', 'user', null, req.ip, req.get('user-agent'), { email });
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user in transaction
    const result = await transaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, verification_token)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name`,
        [email.toLowerCase(), passwordHash, firstName, lastName, phone, verificationToken]
      );

      return userResult.rows[0];
    });

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Account',
        template: 'verification',
        data: {
          firstName,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
          supportEmail: process.env.SUPPORT_EMAIL
        }
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    await logAuditEvent(result.id, 'user_registered', 'user', result.id, req.ip, req.get('user-agent'));

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        id: result.id,
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    await logAuditEvent(null, 'registration_error', 'user', null, req.ip, req.get('user-agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get user from database
    const userResult = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_verified, 
              failed_login_attempts, account_locked_until
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      await logAuditEvent(null, 'login_attempt_invalid_email', 'user', null, req.ip, req.get('user-agent'), { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      await logAuditEvent(user.id, 'login_attempt_locked_account', 'user', user.id, req.ip, req.get('user-agent'));
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failed_login_attempts + 1;
      let lockoutUntil = null;

      // Lock account after 5 failed attempts for 30 minutes
      if (newFailedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await query(
        'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
        [newFailedAttempts, lockoutUntil, user.id]
      );

      await logAuditEvent(user.id, 'login_failed_invalid_password', 'user', user.id, req.ip, req.get('user-agent'));

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - newFailedAttempts)
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      await logAuditEvent(user.id, 'login_attempt_unverified', 'user', user.id, req.ip, req.get('user-agent'));
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in'
      });
    }

    // Reset failed login attempts on successful login
    await query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await query(
      `INSERT INTO sessions (id, user_id, data, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       data = EXCLUDED.data,
       expires_at = EXCLUDED.expires_at`,
      [
        refreshToken,
        user.id,
        JSON.stringify({ ip: req.ip, userAgent: req.get('user-agent') }),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      ]
    );

    await logAuditEvent(user.id, 'login_successful', 'user', user.id, req.ip, req.get('user-agent'));

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        accessToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    await logAuditEvent(null, 'login_error', 'user', null, req.ip, req.get('user-agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if session exists and is valid
    const sessionResult = await query(
      'SELECT user_id, expires_at FROM sessions WHERE id = $1',
      [refreshToken]
    );

    if (sessionResult.rows.length === 0 || new Date() > new Date(sessionResult.rows[0].expires_at)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    const userId = sessionResult.rows[0].user_id;

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Remove session from database
      await query('DELETE FROM sessions WHERE id = $1', [refreshToken]);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    await logAuditEvent(req.user?.id, 'logout', 'user', req.user?.id, req.ip, req.get('user-agent'));

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with verification token
    const userResult = await query(
      'SELECT id, email, first_name FROM users WHERE verification_token = $1 AND is_verified = FALSE',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = userResult.rows[0];

    // Update user as verified
    await query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    await logAuditEvent(user.id, 'email_verified', 'user', user.id, req.ip, req.get('user-agent'));

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, first_name FROM users WHERE email = $1 AND is_verified = TRUE',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          firstName: user.first_name,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
          supportEmail: process.env.SUPPORT_EMAIL
        }
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    await logAuditEvent(user.id, 'password_reset_requested', 'user', user.id, req.ip, req.get('user-agent'));

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Find user with valid reset token
    const userResult = await query(
      `SELECT id, email FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()
       AND is_verified = TRUE`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = userResult.rows[0];

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users SET 
       password_hash = $1, 
       reset_password_token = NULL, 
       reset_password_expires = NULL,
       failed_login_attempts = 0,
       account_locked_until = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Invalidate all existing sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

    await logAuditEvent(user.id, 'password_reset_completed', 'user', user.id, req.ip, req.get('user-agent'));

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
};

// Change password (for authenticated users)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isCurrentPasswordValid) {
      await logAuditEvent(userId, 'password_change_failed_wrong_current', 'user', userId, req.ip, req.get('user-agent'));
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    await logAuditEvent(userId, 'password_changed', 'user', userId, req.ip, req.get('user-agent'));

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword
};
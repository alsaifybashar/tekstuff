const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile (redirect to auth route)
 * @access  Private
 */
router.get('/profile', authenticateToken, (req, res) => {
  res.redirect('/api/auth/me');
});

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin only)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { page = 1, limit = 20, search, role } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereConditions.push(`role = $${paramCount}`);
      queryParams.push(role);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    paramCount++;
    queryParams.push(limitNum);
    paramCount++;
    queryParams.push(offset);

    const usersResult = await query(`
      SELECT 
        id, email, first_name, last_name, phone, role, is_verified, created_at,
        failed_login_attempts, account_locked_until
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, queryParams.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.patch('/:id/role', 
  authenticateToken, 
  requireAdmin,
  [
    body('role')
      .isIn(['admin', 'customer'])
      .withMessage('Role must be either admin or customer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { query } = require('../config/database');
      const { logAuditEvent } = require('../utils/auditLogger');
      const { id } = req.params;
      const { role } = req.body;

      // Check if user exists
      const userCheck = await query('SELECT id, email, role FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userCheck.rows[0];

      // Prevent admin from changing their own role
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role'
        });
      }

      // Update user role
      const result = await query(`
        UPDATE users 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, role
      `, [role, id]);

      await logAuditEvent(
        req.user.id,
        'user_role_updated',
        'user',
        id,
        req.ip,
        req.get('user-agent'),
        { 
          targetUser: user.email,
          oldRole: user.role,
          newRole: role
        }
      );

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user: result.rows[0] }
      });

    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete/deactivate user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { logAuditEvent } = require('../utils/auditLogger');
    const { id } = req.params;

    // Check if user exists
    const userCheck = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has orders
    const orderCheck = await query('SELECT id FROM orders WHERE user_id = $1 LIMIT 1', [id]);
    
    if (orderCheck.rows.length > 0) {
      // User has orders, deactivate instead of delete
      await query(`
        UPDATE users 
        SET is_verified = FALSE, email = CONCAT(email, '_deleted_', EXTRACT(EPOCH FROM NOW()))
        WHERE id = $1
      `, [id]);

      await logAuditEvent(
        req.user.id,
        'user_deactivated',
        'user',
        id,
        req.ip,
        req.get('user-agent'),
        { 
          targetUser: user.email,
          reason: 'has_orders'
        }
      );

      res.json({
        success: true,
        message: 'User account deactivated (user has existing orders)'
      });
    } else {
      // No orders, safe to delete
      await query('DELETE FROM users WHERE id = $1', [id]);

      await logAuditEvent(
        req.user.id,
        'user_deleted',
        'user',
        id,
        req.ip,
        req.get('user-agent'),
        { targetUser: user.email }
      );

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    }

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

/**
 * @route   POST /api/users/:id/unlock
 * @desc    Unlock user account
 * @access  Private (Admin only)
 */
router.post('/:id/unlock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { logAuditEvent } = require('../utils/auditLogger');
    const { id } = req.params;

    const result = await query(`
      UPDATE users 
      SET failed_login_attempts = 0, account_locked_until = NULL
      WHERE id = $1
      RETURNING id, email
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    await logAuditEvent(
      req.user.id,
      'user_account_unlocked',
      'user',
      id,
      req.ip,
      req.get('user-agent'),
      { targetUser: user.email }
    );

    res.json({
      success: true,
      message: 'User account unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock user account'
    });
  }
});

module.exports = router;
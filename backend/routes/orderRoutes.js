const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Order controller functions would go here
// This is a basic structure - you'll need to implement the full order controller

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const userId = req.user.id;
    
    const result = await query(`
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { orders: result.rows }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Implement order creation logic
    res.status(501).json({
      success: false,
      message: 'Order creation not implemented yet'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get specific order
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { id } = req.params;
    const userId = req.user.id;

    const orderResult = await query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'product_snapshot', oi.product_snapshot
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `, [id, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order: orderResult.rows[0] }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order'
    });
  }
});

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders for admin
 * @access  Private (Admin only)
 */
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    let queryParams = [];

    if (status) {
      whereClause = 'WHERE o.status = $1';
      queryParams.push(status);
      queryParams.push(limitNum, offset);
    } else {
      queryParams.push(limitNum, offset);
    }

    const ordersResult = await query(`
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.created_at,
        u.email, u.first_name, u.last_name,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at, u.email, u.first_name, u.last_name
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `, queryParams);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `, status ? [status] : []);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        orders: ordersResult.rows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
});

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { logAuditEvent } = require('../utils/auditLogger');
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Update order status
    const result = await query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, order_number, status
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];

    await logAuditEvent(
      req.user.id, 
      'order_status_updated', 
      'order', 
      id, 
      req.ip, 
      req.get('user-agent'), 
      { orderNumber: order.order_number, newStatus: status }
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

module.exports = router;
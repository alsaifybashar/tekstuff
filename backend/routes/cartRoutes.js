const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} = require('../controllers/cartController');

const router = express.Router();

// Input validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get user's cart
router.get('/', authenticateToken, getCart);

// Add item to cart
router.post('/add',
  authenticateToken,
  [
    body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999')
  ],
  handleValidationErrors,
  addToCart
);

// Update cart item quantity
router.put('/:itemId',
  authenticateToken,
  [
    body('quantity').isInt({ min: 0, max: 999 }).withMessage('Quantity must be between 0 and 999')
  ],
  handleValidationErrors,
  updateCartItem
);

// Remove item from cart
router.delete('/:itemId', authenticateToken, removeFromCart);

// Clear entire cart
router.delete('/', authenticateToken, clearCart);

module.exports = router;
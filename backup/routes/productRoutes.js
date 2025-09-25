const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  removeProductImage,
  getLowStockProducts,
  getProductAnalytics
} = require('../controllers/productController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../utils/imageUpload');

const router = express.Router();

// Public routes
/**
 * @route   GET /api/products
 * @desc    Get all products with filtering
 * @access  Public
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID or slug
 * @access  Public
 */
router.get('/:id', getProduct);

// Admin routes
/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  upload.array('images', 5),
  createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  upload.array('images', 5),
  updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin only)
 */
router.patch('/:id/stock', authenticateToken, requireAdmin, updateStock);
// This causes the error if updateProduct is undefined
   router.patch('/:id', updateProduct);



/**
 * @route   DELETE /api/products/:id/image
 * @desc    Remove product image
 * @access  Private (Admin only)
 */
router.delete('/:id/image', authenticateToken, requireAdmin, removeProductImage);

/**
 * @route   GET /api/products/admin/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin only)
 */
router.get('/admin/low-stock', authenticateToken, requireAdmin, getLowStockProducts);

/**
 * @route   GET /api/products/:id/analytics
 * @desc    Get product analytics
 * @access  Private (Admin only)
 */
router.get('/:id/analytics', authenticateToken, requireAdmin, getProductAnalytics);

module.exports = router;
import express from 'express';
import { body, query, param } from 'express-validator';
import { 
  getProducts, 
  getProductById, 
  getProductBySlug,
  getProductsBatch,
  searchProducts,
  getRelatedProducts,
  getFeaturedProducts
} from '../controllers/productController.js';
import { validateRequest } from '../middleware/validation.js';
import { cacheMiddleware } from '../services/cacheService.js';

const router = express.Router();

// Validation schemas
const productListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isSlug().withMessage('Category must be a valid slug'),
  query('brands').optional().isString().withMessage('Brands must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('type').optional().isIn(['cable', 'charger', 'adapter', 'wireless-charger', 'power-bank', 'accessory']),
  query('connector').optional().isIn(['usb-c', 'lightning', 'micro-usb', 'usb-a', 'wireless', 'magsafe']),
  query('cableLength').optional().isIn(['0.3m', '1m', '1.5m', '2m', '3m', '5m']),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
  query('deals').optional().isBoolean().withMessage('deals must be true or false'),
  query('featured').optional().isBoolean().withMessage('featured must be true or false'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'popular', 'rating'])
];

const productIdValidation = [
  param('id').isMongoId().withMessage('Invalid product ID format')
];

const productSlugValidation = [
  param('slug').isSlug().withMessage('Invalid slug format')
];

const batchValidation = [
  query('ids').isString().withMessage('IDs parameter is required')
];

const searchValidation = [
  query('q').isLength({ min: 2, max: 100 }).withMessage('Search query must be 2-100 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

// Routes

/**
 * @route   GET /v1/products
 * @desc    Get products with optional filtering, pagination, and sorting
 * @access  Public
 * @cache   5 minutes
 */
router.get('/', 
  productListValidation,
  validateRequest,
  cacheMiddleware(300), // 5 minutes cache
  getProducts
);

/**
 * @route   GET /v1/products/featured
 * @desc    Get featured products
 * @access  Public
 * @cache   10 minutes
 */
router.get('/featured',
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  validateRequest,
  cacheMiddleware(600), // 10 minutes cache
  getFeaturedProducts
);

/**
 * @route   GET /v1/products/search
 * @desc    Search products by text
 * @access  Public
 * @cache   2 minutes
 */
router.get('/search',
  searchValidation,
  validateRequest,
  cacheMiddleware(120), // 2 minutes cache
  searchProducts
);

/**
 * @route   GET /v1/products/batch
 * @desc    Get multiple products by IDs
 * @access  Public
 * @cache   5 minutes
 */
router.get('/batch',
  batchValidation,
  validateRequest,
  cacheMiddleware(300), // 5 minutes cache
  getProductsBatch
);

/**
 * @route   GET /v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 * @cache   10 minutes
 */
router.get('/slug/:slug',
  productSlugValidation,
  validateRequest,
  cacheMiddleware(600), // 10 minutes cache
  getProductBySlug
);

/**
 * @route   GET /v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 * @cache   10 minutes
 */
router.get('/:id',
  productIdValidation,
  validateRequest,
  cacheMiddleware(600), // 10 minutes cache
  getProductById
);

/**
 * @route   GET /v1/products/:id/related
 * @desc    Get related products
 * @access  Public
 * @cache   15 minutes
 */
router.get('/:id/related',
  productIdValidation,
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  validateRequest,
  cacheMiddleware(900), // 15 minutes cache
  getRelatedProducts
);

export default router;
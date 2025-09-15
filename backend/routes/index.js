// routes/index.js
import express from 'express';
import { cacheMiddleware } from '../services/cacheService.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /
 * @desc    API root endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Webshop API v1',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      products: '/v1/products',
      categories: '/v1/categories',
      auth: '/v1/auth',
      health: '/health'
    },
    documentation: 'https://your-docs-url.com'
  });
});

/**
 * @route   GET /v1/stats
 * @desc    Get API statistics
 * @access  Public
 */
router.get('/v1/stats',
  cacheMiddleware(1800), // 30 minutes cache
  async (req, res, next) => {
    try {
      const [
        totalProducts,
        totalCategories,
        featuredProducts,
        dealsCount
      ] = await Promise.all([
        Product.countDocuments({ status: 'active' }),
        Category.countDocuments({ isActive: true }),
        Product.countDocuments({ status: 'active', isFeatured: true }),
        Product.countDocuments({ status: 'active', isDeal: true })
      ]);

      res.json({
        products: {
          total: totalProducts,
          featured: featuredProducts,
          deals: dealsCount
        },
        categories: {
          total: totalCategories
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
      next(new AppError('Failed to fetch statistics', 500));
    }
  }
);

export default router;
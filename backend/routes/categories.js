// routes/categories.js
import express from 'express';
import { query } from 'express-validator';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { validateRequest } from '../middleware/validation.js';
import { cacheMiddleware } from '../services/cacheService.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /v1/categories
 * @desc    Get all categories with product counts
 * @access  Public
 */
router.get('/', 
  cacheMiddleware(900), // 15 minutes cache
  async (req, res, next) => {
    try {
      const categories = await Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'products',
            let: { categorySlug: '$slug' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$categorySlug', '$$categorySlug'] },
                      { $eq: ['$status', 'active'] }
                    ]
                  }
                }
              },
              { $count: 'total' }
            ],
            as: 'productCount'
          }
        },
        {
          $addFields: {
            count: { $ifNull: [{ $arrayElemAt: ['$productCount.total', 0] }, 0] }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            description: 1,
            image: 1,
            count: 1,
            sortOrder: 1
          }
        },
        { $sort: { sortOrder: 1, name: 1 } }
      ]);

      res.json(categories);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      next(new AppError('Failed to fetch categories', 500));
    }
  }
);

/**
 * @route   GET /v1/categories/:slug
 * @desc    Get category by slug with products
 * @access  Public
 */
router.get('/:slug',
  cacheMiddleware(600), // 10 minutes cache
  async (req, res, next) => {
    try {
      const { slug } = req.params;
      
      const category = await Category.findOne({ 
        slug, 
        isActive: true 
      });
      
      if (!category) {
        return next(new AppError('Category not found', 404));
      }

      res.json(category);
    } catch (error) {
      logger.error('Error fetching category:', error);
      next(new AppError('Failed to fetch category', 500));
    }
  }
);

export default router;
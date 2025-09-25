const express = require('express');
const { query, validationResult } = require('express-validator');
const { searchProducts, getSearchSuggestions } = require('../controllers/searchController');

const router = express.Router();

// Search products
router.get('/products', 
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('category').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  searchProducts
);

// Get search suggestions/autocomplete
router.get('/suggestions',
  [
    query('q').isLength({ min: 2 }).withMessage('Query must be at least 2 characters')
  ],
  getSearchSuggestions
);

module.exports = router;
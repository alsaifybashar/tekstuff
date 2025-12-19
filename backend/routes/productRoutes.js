const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
// You can add auth middleware here later, e.g. const { protect, admin } = require('../middleware/authMiddleware');

// Routes
router.route('/')
  .get(getProducts)
  .post(createProduct); // consider adding protect, admin middleware

router.route('/:id')
  .get(getProduct)
  .put(updateProduct) // consider adding protect, admin middleware
  .delete(deleteProduct); // consider adding protect, admin middleware

module.exports = router;

const express = require('express');
const router = express.Router();

// Mock product controller functions (replace with your actual ones later)
const mockController = {
  getProducts: (req, res) => {
    res.json({
      success: true,
      data: {
        products: [
          { id: 1, name: 'Sample Product 1', price: 29.99, inStock: true },
          { id: 2, name: 'Sample Product 2', price: 49.99, inStock: true }
        ]
      }
    });
  },
  
  getProduct: (req, res) => {
    res.json({
      success: true,
      data: {
        product: {
          id: req.params.id,
          name: 'Sample Product',
          price: 29.99,
          description: 'This is a sample product',
          inStock: true
        }
      }
    });
  },
  
  createProduct: (req, res) => {
    res.json({
      success: true,
      message: 'Product created successfully',
      data: { product: { id: 123, ...req.body } }
    });
  }
};

// Routes
router.get('/', mockController.getProducts);
router.get('/:id', mockController.getProduct);
router.post('/', mockController.createProduct);

module.exports = router;

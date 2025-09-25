const express = require('express');
const router = express.Router();

// Basic analytics routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Analytics endpoint working',
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0
      }
    }
  });
});

module.exports = router;

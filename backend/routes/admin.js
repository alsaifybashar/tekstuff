// routes/admin.js
import express from 'express';
import { adminRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, requireAdmin } from '../middleware/security.js';

const router = express.Router();

// Apply admin rate limiting and authentication
router.use(adminRateLimit);
// Commenting out auth middleware until user system is implemented
// router.use(requireAuth);
// router.use(requireAdmin);

/**
 * Admin routes - placeholder for future implementation
 */

router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Admin dashboard coming soon'
  });
});

export default router;
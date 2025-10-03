const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authMiddleware, requireAuth, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../utils/auditLogger');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'temp');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    files: 10
  },
  fileFilter
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Product image upload
router.post('/products/:productId/images', requireAuth, requireRole(['admin', 'manager']), upload.array('images', 10), async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Verify product exists and user has access
    const client = await pool.connect();
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const processedImages = [];
    
    for (const file of req.files) {
      // Process image with Sharp
      const processedFileName = `product-${productId}-${uuidv4()}.webp`;
      const processedPath = path.join(__dirname, '..', 'uploads', 'products', processedFileName);
      
      await sharp(file.path)
        .resize(800, 800, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toFile(processedPath);

      // Generate thumbnail
      const thumbnailFileName = `thumb-${processedFileName}`;
      const thumbnailPath = path.join(__dirname, '..', 'uploads', 'products', thumbnailFileName);
      
      await sharp(file.path)
        .resize(200, 200, { 
          fit: 'cover' 
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      const imageData = {
        id: uuidv4(),
        url: `/uploads/products/${processedFileName}`,
        thumbnailUrl: `/uploads/products/${thumbnailFileName}`,
        alt: `${productResult.rows[0].name} image`,
        isPrimary: processedImages.length === 0,
        sortOrder: processedImages.length
      };

      processedImages.push(imageData);

      // Clean up temp file
      require('fs').unlinkSync(file.path);
    }

    // Update product images in database
    const currentImages = productResult.rows[0].images || [];
    const updatedImages = [...currentImages, ...processedImages];
    
    await client.query(
      'UPDATE products SET images = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(updatedImages), productId]
    );

    client.release();

    // Log image upload
    await logAuditEvent(
      req.user.id,
      'product_images_upload',
      'product',
      productId,
      req.ip,
      req.get('user-agent'),
      { imageCount: processedImages.length }
    );

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      images: processedImages
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          require('fs').unlinkSync(file.path);
        } catch (e) {
          console.error('Error cleaning up file:', e);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete product image
router.delete('/products/:productId/images/:imageId', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    const client = await pool.connect();
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentImages = productResult.rows[0].images || [];
    const imageIndex = currentImages.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const imageToDelete = currentImages[imageIndex];
    
    // Remove from filesystem
    const imagePath = path.join(__dirname, '..', imageToDelete.url);
    const thumbnailPath = path.join(__dirname, '..', imageToDelete.thumbnailUrl);
    
    try {
      require('fs').unlinkSync(imagePath);
      require('fs').unlinkSync(thumbnailPath);
    } catch (fsError) {
      console.error('Error deleting image files:', fsError);
    }

    // Update database
    const updatedImages = currentImages.filter(img => img.id !== imageId);
    await client.query(
      'UPDATE products SET images = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(updatedImages), productId]
    );

    client.release();

    // Log image deletion
    await logAuditEvent(
      req.user.id,
      'product_image_delete',
      'product',
      productId,
      req.ip,
      req.get('user-agent'),
      { imageId }
    );

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Image deletion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Category image upload
router.post('/categories/:categoryId/image', requireAuth, requireRole(['admin', 'manager']), upload.single('image'), async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const client = await pool.connect();
    const categoryResult = await client.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Process image
    const processedFileName = `category-${categoryId}-${uuidv4()}.webp`;
    const processedPath = path.join(__dirname, '..', 'uploads', 'categories', processedFileName);
    
    await sharp(req.file.path)
      .resize(400, 300, { 
        fit: 'cover' 
      })
      .webp({ quality: 85 })
      .toFile(processedPath);

    const imageUrl = `/uploads/categories/${processedFileName}`;

    // Delete old image if exists
    const oldImageUrl = categoryResult.rows[0].image_url;
    if (oldImageUrl) {
      const oldImagePath = path.join(__dirname, '..', oldImageUrl);
      try {
        require('fs').unlinkSync(oldImagePath);
      } catch (e) {
        console.error('Error deleting old category image:', e);
      }
    }

    // Update database
    await client.query(
      'UPDATE categories SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imageUrl, categoryId]
    );

    client.release();

    // Clean up temp file
    require('fs').unlinkSync(req.file.path);

    // Log image upload
    await logAuditEvent(
      req.user.id,
      'category_image_upload',
      'category',
      categoryId,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      message: 'Category image uploaded successfully',
      imageUrl
    });

  } catch (error) {
    console.error('Category image upload error:', error);
    
    if (req.file) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// User avatar upload
router.post('/users/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file provided' });
    }

    // Process avatar
    const avatarFileName = `avatar-${req.user.id}-${uuidv4()}.webp`;
    const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', avatarFileName);
    
    await sharp(req.file.path)
      .resize(200, 200, { 
        fit: 'cover' 
      })
      .webp({ quality: 85 })
      .toFile(avatarPath);

    const avatarUrl = `/uploads/avatars/${avatarFileName}`;

    const client = await pool.connect();
    
    // Delete old avatar if exists
    const userResult = await client.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    const oldAvatarUrl = userResult.rows[0]?.avatar_url;
    
    if (oldAvatarUrl) {
      const oldAvatarPath = path.join(__dirname, '..', oldAvatarUrl);
      try {
        require('fs').unlinkSync(oldAvatarPath);
      } catch (e) {
        console.error('Error deleting old avatar:', e);
      }
    }

    // Update database
    await client.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, req.user.id]
    );

    client.release();

    // Clean up temp file
    require('fs').unlinkSync(req.file.path);

    // Log avatar upload
    await logAuditEvent(
      req.user.id,
      'avatar_upload',
      'user',
      req.user.id,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (req.file) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Avatar upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Stripe webhook endpoint
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    const client = await pool.connect();

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update order payment status
        await client.query(
          'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_intent_id = $2',
          ['paid', paymentIntent.id]
        );
        
        console.log('Payment succeeded for PaymentIntent:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        // Update order payment status
        await client.query(
          'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_intent_id = $2',
          ['failed', failedPayment.id]
        );
        
        console.log('Payment failed for PaymentIntent:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    client.release();
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
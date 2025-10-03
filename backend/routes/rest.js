const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authMiddleware, requireAuth, requireRole } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../utils/auditLogger');
const router = express.Router();

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
ensureDir(uploadsDir);
ensureDir(path.join(uploadsDir, 'temp'));
ensureDir(path.join(uploadsDir, 'products'));
ensureDir(path.join(uploadsDir, 'categories'));
ensureDir(path.join(uploadsDir, 'avatars'));

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

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'REST API'
  });
});

// Product image upload endpoint
router.post('/products/:productId/images', requireAuth, requireRole(['admin', 'manager']), upload.array('images', 10), async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    // Verify product exists
    const client = await pool.connect();
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    if (productResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const processedImages = [];
    
    for (const file of req.files) {
      try {
        // Process main image
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
        fs.unlinkSync(file.path);
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        // Clean up temp file on error
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    if (processedImages.length === 0) {
      client.release();
      return res.status(500).json({ success: false, message: 'Failed to process any images' });
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
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }

    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Simple file upload test endpoint
router.post('/upload/test', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

module.exports = router;
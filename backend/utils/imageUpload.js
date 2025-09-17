const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { generateSecureFilename, validateFileUpload } = require('./security');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const validation = validateFileUpload(file, {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  });

  if (!validation.isValid) {
    return cb(new Error(validation.errors.join(', ')), false);
  }
  
  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files
  },
  fileFilter
});

/**
 * Upload and process image
 * @param {object} file - Multer file object
 * @param {string} folder - Folder name for organization
 * @param {object} options - Processing options
 * @returns {Promise<string>} - Relative path to uploaded image
 */
const uploadImage = async (file, folder = 'uploads', options = {}) => {
  try {
    const {
      width = 800,
      height = 800,
      quality = 85,
      format = 'jpeg'
    } = options;

    // Generate secure filename
    const filename = generateSecureFilename(file.originalname);
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    
    // Process image with Sharp
    let sharpInstance = sharp(file.buffer);
    
    // Get original image metadata
    const metadata = await sharpInstance.metadata();
    
    // Only resize if image is larger than target dimensions
    if (metadata.width > width || metadata.height > height) {
      sharpInstance = sharpInstance.resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      });
    }
    
    // Convert to specified format with quality
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }
    
    // Save processed image
    await sharpInstance.toFile(filepath);
    
    // Return relative path for storage in database
    return `/uploads/${folder}/${filename}`;
    
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of multer file objects
 * @param {string} folder - Folder name for organization
 * @param {object} options - Processing options
 * @returns {Promise<Array>} - Array of relative paths to uploaded images
 */
const uploadMultipleImages = async (files, folder = 'uploads', options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple image upload failed:', error);
    throw new Error(`Multiple image upload failed: ${error.message}`);
  }
};

/**
 * Delete image file
 * @param {string} imageUrl - Relative path to image
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      console.warn('Invalid image URL for deletion:', imageUrl);
      return false;
    }
    
    const filepath = path.join(process.cwd(), imageUrl);
    
    // Check if file exists before attempting deletion
    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
      console.log('Image deleted successfully:', imageUrl);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('Image file not found:', imageUrl);
        return false; // File doesn't exist, consider it "deleted"
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
};

/**
 * Delete multiple images
 * @param {Array} imageUrls - Array of relative paths to images
 * @returns {Promise<object>} - Results summary
 */
const deleteMultipleImages = async (imageUrls) => {
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const imageUrl of imageUrls) {
    try {
      const success = await deleteImage(imageUrl);
      if (success) {
        results.successful++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ imageUrl, error: error.message });
    }
  }
  
  return results;
};

/**
 * Generate thumbnail
 * @param {string} imageUrl - Original image URL
 * @param {object} options - Thumbnail options
 * @returns {Promise<string>} - Thumbnail URL
 */
const generateThumbnail = async (imageUrl, options = {}) => {
  try {
    const {
      width = 200,
      height = 200,
      quality = 80
    } = options;
    
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      throw new Error('Invalid image URL');
    }
    
    const originalPath = path.join(process.cwd(), imageUrl);
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    
    const thumbnailFilename = `${basename}_thumb_${width}x${height}${ext}`;
    const thumbnailPath = path.join(dir, thumbnailFilename);
    
    // Check if thumbnail already exists
    try {
      await fs.access(thumbnailPath);
      // Thumbnail exists, return its URL
      const relativePath = path.relative(process.cwd(), thumbnailPath);
      return '/' + relativePath.replace(/\\/g, '/'); // Normalize path separators
    } catch (error) {
      // Thumbnail doesn't exist, create it
    }
    
    await sharp(originalPath)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality })
      .toFile(thumbnailPath);
    
    const relativePath = path.relative(process.cwd(), thumbnailPath);
    return '/' + relativePath.replace(/\\/g, '/'); // Normalize path separators
    
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
};

/**
 * Get image info
 * @param {string} imageUrl - Image URL
 * @returns {Promise<object>} - Image metadata
 */
const getImageInfo = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      throw new Error('Invalid image URL');
    }
    
    const filepath = path.join(process.cwd(), imageUrl);
    const metadata = await sharp(filepath).metadata();
    const stats = await fs.stat(filepath);
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
    
  } catch (error) {
    console.error('Failed to get image info:', error);
    throw new Error(`Failed to get image info: ${error.message}`);
  }
};

/**
 * Clean up temporary files older than specified time
 * @param {number} maxAgeHours - Maximum age in hours
 * @returns {Promise<number>} - Number of files cleaned up
 */
const cleanupTempFiles = async (maxAgeHours = 24) => {
  try {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist, nothing to clean
    }
    
    console.log(`Cleaned up ${cleanedCount} temporary files`);
    return cleanedCount;
    
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
    return 0;
  }
};

module.exports = {
  upload,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  generateThumbnail,
  getImageInfo,
  cleanupTempFiles
};
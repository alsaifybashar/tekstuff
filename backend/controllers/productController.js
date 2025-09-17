const { query, transaction } = require('../config/database');
const { logAuditEvent } = require('../utils/auditLogger');
const { uploadImage, deleteImage } = require('../utils/imageUpload');
const validator = require('validator');

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build dynamic query
    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereConditions.push(`p.category_id = $${paramCount}`);
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (minPrice) {
      paramCount++;
      whereConditions.push(`p.price >= $${paramCount}`);
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      whereConditions.push(`p.price <= $${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    if (inStock === 'true') {
      whereConditions.push('p.stock_quantity > 0');
    }

    if (featured === 'true') {
      whereConditions.push('p.is_featured = TRUE');
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'price', 'created_at', 'stock_quantity'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get products with category information
    const productsQuery = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.short_description,
        p.sku, p.price, p.compare_price, p.stock_quantity,
        p.images, p.is_featured, p.created_at,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limitNum, offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      query(productsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    ]);

    const products = productsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
};

// Get single product by ID or slug
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is numeric (product ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const field = isNumeric ? 'p.id' : 'p.slug';
    
    const productResult = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.short_description,
        p.sku, p.price, p.compare_price, p.cost_price, p.stock_quantity,
        p.low_stock_threshold, p.weight, p.dimensions, p.images,
        p.is_active, p.is_featured, p.meta_title, p.meta_description,
        p.tags, p.created_at, p.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${field} = $1 AND p.is_active = TRUE
    `, [id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    res.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product'
    });
  }
};

// Create new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      sku,
      price,
      comparePrice,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      weight,
      dimensions,
      categoryId,
      isActive = true,
      isFeatured = false,
      metaTitle,
      metaDescription,
      tags = []
    } = req.body;

    // Input validation
    if (!name || !sku || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, and price are required'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Check if SKU already exists
    const existingSku = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Check if slug already exists
    const existingSlug = await query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    // Validate category if provided
    if (categoryId) {
      const categoryResult = await query('SELECT id FROM categories WHERE id = $1 AND is_active = TRUE', [categoryId]);
      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const imageUrl = await uploadImage(file, 'products');
          images.push(imageUrl);
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    }

    // Create product
    const result = await query(`
      INSERT INTO products (
        name, slug, description, short_description, sku, price, compare_price,
        cost_price, stock_quantity, low_stock_threshold, weight, dimensions,
        category_id, images, is_active, is_featured, meta_title, meta_description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, name, slug, sku, price
    `, [
      name, slug, description, shortDescription, sku, parseFloat(price),
      comparePrice ? parseFloat(comparePrice) : null,
      costPrice ? parseFloat(costPrice) : null,
      parseInt(stockQuantity) || 0,
      parseInt(lowStockThreshold) || 10,
      weight ? parseFloat(weight) : null,
      dimensions ? JSON.stringify(dimensions) : null,
      categoryId || null,
      JSON.stringify(images),
      isActive,
      isFeatured,
      metaTitle || name,
      metaDescription || shortDescription,
      tags
    ]);

    const product = result.rows[0];

    await logAuditEvent(req.user.id, 'product_created', 'product', product.id, req.ip, req.get('user-agent'), { productName: name });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);
    await logAuditEvent(req.user.id, 'product_creation_error', 'product', null, req.ip, req.get('user-agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if product exists
    const existingProduct = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = existingProduct.rows[0];

    // Build dynamic update query
    const allowedFields = [
      'name', 'description', 'short_description', 'price', 'compare_price',
      'cost_price', 'stock_quantity', 'low_stock_threshold', 'weight',
      'dimensions', 'category_id', 'is_active', 'is_featured',
      'meta_title', 'meta_description', 'tags'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        
        // Handle special cases
        if (key === 'dimensions') {
          updateValues.push(JSON.stringify(value));
        } else if (['price', 'compare_price', 'cost_price', 'weight'].includes(key)) {
          updateValues.push(value ? parseFloat(value) : null);
        } else if (['stock_quantity', 'low_stock_threshold', 'category_id'].includes(key)) {
          updateValues.push(value ? parseInt(value) : null);
        } else {
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update slug if name is being updated
    if (updates.name) {
      const newSlug = updates.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Check if new slug already exists (excluding current product)
      const slugCheck = await query('SELECT id FROM products WHERE slug = $1 AND id != $2', [newSlug, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }

      paramCount++;
      updateFields.push(`slug = $${paramCount}`);
      updateValues.push(newSlug);
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      try {
        let images = product.images ? JSON.parse(product.images) : [];
        
        for (const file of req.files) {
          const imageUrl = await uploadImage(file, 'products');
          images.push(imageUrl);
        }

        paramCount++;
        updateFields.push(`images = $${paramCount}`);
        updateValues.push(JSON.stringify(images));
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    }

    // Add updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add product ID for WHERE clause
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, slug, sku, price, stock_quantity
    `;

    const result = await query(updateQuery, updateValues);
    const updatedProduct = result.rows[0];

    await logAuditEvent(req.user.id, 'product_updated', 'product', id, req.ip, req.get('user-agent'), { 
      productName: updatedProduct.name,
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update product error:', error);
    await logAuditEvent(req.user.id, 'product_update_error', 'product', id, req.ip, req.get('user-agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const productResult = await query('SELECT name, images FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Check if product is referenced in any orders
    const orderCheck = await query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
    if (orderCheck.rows.length > 0) {
      // Don't actually delete, just deactivate
      await query('UPDATE products SET is_active = FALSE WHERE id = $1', [id]);
      
      await logAuditEvent(req.user.id, 'product_deactivated', 'product', id, req.ip, req.get('user-agent'), { 
        productName: product.name,
        reason: 'referenced_in_orders'
      });

      return res.json({
        success: true,
        message: 'Product deactivated successfully (cannot delete due to existing orders)'
      });
    }

    // Delete associated images
    if (product.images) {
      try {
        const images = JSON.parse(product.images);
        for (const imageUrl of images) {
          await deleteImage(imageUrl);
        }
      } catch (imageError) {
        console.error('Failed to delete product images:', imageError);
      }
    }

    // Delete product
    await query('DELETE FROM products WHERE id = $1', [id]);

    await logAuditEvent(req.user.id, 'product_deleted', 'product', id, req.ip, req.get('user-agent'), { 
      productName: product.name 
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    await logAuditEvent(req.user.id, 'product_deletion_error', 'product', req.params.id, req.ip, req.get('user-agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Update product stock (Admin only)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    let updateQuery;
    let newQuantity;

    if (operation === 'set') {
      updateQuery = 'UPDATE products SET stock_quantity = $1 WHERE id = $2 RETURNING stock_quantity, name';
      newQuantity = quantity;
    } else if (operation === 'add') {
      updateQuery = 'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING stock_quantity, name';
      newQuantity = quantity;
    } else if (operation === 'subtract') {
      updateQuery = 'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2 RETURNING stock_quantity, name';
      newQuantity = quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "set", "add", or "subtract"'
      });
    }

    const result = await query(updateQuery, [newQuantity, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updatedProduct = result.rows[0];

    await logAuditEvent(req.user.id, 'product_stock_updated', 'product', id, req.ip, req.get('user-agent'), {
      productName: updatedProduct.name,
      operation,
      quantity: newQuantity,
      newStock: updatedProduct.stock_quantity
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: id,
        newStockQuantity: updatedProduct.stock_quantity
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
};

// Remove product image (Admin only)
const removeProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Get product current images
    const productResult = await query('SELECT images, name FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    let images = product.images ? JSON.parse(product.images) : [];

    // Check if image exists in product
    const imageIndex = images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in product'
      });
    }

    // Remove image from array
    images.splice(imageIndex, 1);

    // Update product
    await query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify(images), id]);

    // Delete image file
    try {
      await deleteImage(imageUrl);
    } catch (deleteError) {
      console.error('Failed to delete image file:', deleteError);
    }

    await logAuditEvent(req.user.id, 'product_image_removed', 'product', id, req.ip, req.get('user-agent'), {
      productName: product.name,
      imageUrl
    });

    res.json({
      success: true,
      message: 'Image removed successfully'
    });

  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove image'
    });
  }
};

// Get low stock products (Admin only)
const getLowStockProducts = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, name, sku, stock_quantity, low_stock_threshold,
        price, category_id
      FROM products 
      WHERE stock_quantity <= low_stock_threshold 
      AND is_active = TRUE
      ORDER BY stock_quantity ASC
    `);

    res.json({
      success: true,
      data: {
        products: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock products'
    });
  }
};

// Get product analytics (Admin only)
const getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get product sales data
    const salesResult = await query(`
      SELECT 
        COUNT(oi.id) as total_orders,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total_price) as total_revenue,
        AVG(oi.unit_price) as average_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1 
      AND o.status NOT IN ('cancelled', 'refunded')
      AND o.created_at >= $2
    `, [id, startDate]);

    // Get daily sales for the period
    const dailySalesResult = await query(`
      SELECT 
        DATE(o.created_at) as sale_date,
        COUNT(oi.id) as orders,
        SUM(oi.quantity) as quantity,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1 
      AND o.status NOT IN ('cancelled', 'refunded')
      AND o.created_at >= $2
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date
    `, [id, startDate]);

    // Get current product info
    const productResult = await query(`
      SELECT name, sku, price, stock_quantity, created_at
      FROM products WHERE id = $1
    `, [id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    const analytics = salesResult.rows[0];

    res.json({
      success: true,
      data: {
        product: {
          name: product.name,
          sku: product.sku,
          currentPrice: product.price,
          currentStock: product.stock_quantity,
          createdAt: product.created_at
        },
        analytics: {
          period: `${periodDays} days`,
          totalOrders: parseInt(analytics.total_orders) || 0,
          totalQuantitySold: parseInt(analytics.total_quantity_sold) || 0,
          totalRevenue: parseFloat(analytics.total_revenue) || 0,
          averagePrice: parseFloat(analytics.average_price) || 0
        },
        dailySales: dailySalesResult.rows
      }
    });

  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product analytics'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  removeProductImage,
  getLowStockProducts,
  getProductAnalytics
};
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const result = await query(`
      SELECT id, name, slug, description, image_url, parent_id
      FROM categories 
      WHERE is_active = TRUE 
      ORDER BY name
    `);

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { id } = req.params;

    // Check if ID is numeric (category ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const field = isNumeric ? 'id' : 'slug';

    const result = await query(`
      SELECT id, name, slug, description, image_url, parent_id, created_at
      FROM categories 
      WHERE ${field} = $1 AND is_active = TRUE
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category: result.rows[0] }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category'
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Private (Admin only)
 */
router.post('/', 
  authenticateToken, 
  requireAdmin,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be 2-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('parentId')
      .optional()
      .isInt()
      .withMessage('Parent ID must be a valid number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { query } = require('../config/database');
      const { logAuditEvent } = require('../utils/auditLogger');
      const { name, description, imageUrl, parentId } = req.body;

      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

      // Check if slug already exists
      const existingSlug = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
      if (existingSlug.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      // Validate parent category if provided
      if (parentId) {
        const parentCheck = await query('SELECT id FROM categories WHERE id = $1 AND is_active = TRUE', [parentId]);
        if (parentCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent category'
          });
        }
      }

      const result = await query(`
        INSERT INTO categories (name, slug, description, image_url, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, slug, description, image_url, parent_id
      `, [name, slug, description || null, imageUrl || null, parentId || null]);

      const category = result.rows[0];

      await logAuditEvent(
        req.user.id,
        'category_created',
        'category',
        category.id,
        req.ip,
        req.get('user-agent'),
        { categoryName: name }
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    }
  }
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  requireAdmin,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be 2-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('parentId')
      .optional()
      .isInt()
      .withMessage('Parent ID must be a valid number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { query } = require('../config/database');
      const { logAuditEvent } = require('../utils/auditLogger');
      const { id } = req.params;
      const updates = req.body;

      // Check if category exists
      const existingCategory = await query('SELECT * FROM categories WHERE id = $1', [id]);
      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Build dynamic update query
      const allowedFields = ['name', 'description', 'image_url', 'parent_id', 'is_active'];
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
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

        // Check if new slug already exists (excluding current category)
        const slugCheck = await query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [newSlug, id]);
        if (slugCheck.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }

        paramCount++;
        updateFields.push(`slug = $${paramCount}`);
        updateValues.push(newSlug);
      }

      // Add updated_at timestamp
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());

      // Add category ID for WHERE clause
      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE categories 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, slug, description, image_url, parent_id, is_active
      `;

      const result = await query(updateQuery, updateValues);
      const updatedCategory = result.rows[0];

      await logAuditEvent(
        req.user.id,
        'category_updated',
        'category',
        id,
        req.ip,
        req.get('user-agent'),
        { 
          categoryName: updatedCategory.name,
          updatedFields: Object.keys(updates)
        }
      );

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    }
  }
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { logAuditEvent } = require('../utils/auditLogger');
    const { id } = req.params;

    // Check if category exists
    const categoryCheck = await query('SELECT id, name FROM categories WHERE id = $1', [id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = categoryCheck.rows[0];

    // Check if category has products
    const productCheck = await query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (productCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that contains products'
      });
    }

    // Check if category has subcategories
    const subcategoryCheck = await query('SELECT id FROM categories WHERE parent_id = $1 LIMIT 1', [id]);
    if (subcategoryCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has subcategories'
      });
    }

    // Delete category
    await query('DELETE FROM categories WHERE id = $1', [id]);

    await logAuditEvent(
      req.user.id,
      'category_deleted',
      'category',
      id,
      req.ip,
      req.get('user-agent'),
      { categoryName: category.name }
    );

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get products in a category
 * @access  Public
 */
router.get('/:id/products', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Check if ID is numeric (category ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const field = isNumeric ? 'p.category_id' : 'c.slug';
    const value = isNumeric ? id : id;

    const productsResult = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.short_description,
        p.sku, p.price, p.compare_price, p.stock_quantity,
        p.images, p.is_featured, p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE ${field} = $1 AND p.is_active = TRUE AND c.is_active = TRUE
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [value, limitNum, offset]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE ${field} = $1 AND p.is_active = TRUE AND c.is_active = TRUE
    `, [value]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        products: productsResult.rows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category products'
    });
  }
});

module.exports = router;
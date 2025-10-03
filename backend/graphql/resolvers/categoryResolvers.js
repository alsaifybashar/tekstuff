const { pool } = require('../../config/database');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { logAuditEvent } = require('../../utils/auditLogger');
const slugify = require('slugify');

const categoryResolvers = {
  Query: {
    categories: async (_, { filter = {}, pagination = {} }) => {
      try {
        const client = await pool.connect();
        let query = 'SELECT * FROM categories';
        const conditions = [];
        const params = [];
        let paramCount = 0;

        // Apply filters
        if (filter.parentId !== undefined) {
          if (filter.parentId === null) {
            conditions.push('parent_id IS NULL');
          } else {
            conditions.push(`parent_id = $${++paramCount}`);
            params.push(filter.parentId);
          }
        }

        if (filter.isActive !== undefined) {
          conditions.push(`is_active = $${++paramCount}`);
          params.push(filter.isActive);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sort_order ASC, name ASC';

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
        const countResult = await client.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Apply pagination
        const first = pagination.first || 50;
        const offset = pagination.after ? parseInt(Buffer.from(pagination.after, 'base64').toString()) : 0;
        
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(first, offset);

        const result = await client.query(query, params);
        client.release();

        const edges = result.rows.map((row, index) => ({
          node: {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            imageUrl: row.image_url,
            isActive: row.is_active,
            sortOrder: row.sort_order,
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          },
          cursor: Buffer.from((offset + index + 1).toString()).toString('base64')
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage: offset + first < totalCount,
            hasPreviousPage: offset > 0,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
          },
          totalCount
        };
      } catch (error) {
        console.error('Categories query error:', error);
        throw error;
      }
    },

    category: async (_, { id, slug }) => {
      try {
        const client = await pool.connect();
        
        let query = 'SELECT * FROM categories WHERE';
        let params;
        
        if (id) {
          query += ' id = $1';
          params = [id];
        } else if (slug) {
          query += ' slug = $1';
          params = [slug];
        } else {
          throw new UserInputError('Either id or slug must be provided');
        }

        const result = await client.query(query, params);
        client.release();

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          imageUrl: row.image_url,
          isActive: row.is_active,
          sortOrder: row.sort_order,
          metaTitle: row.meta_title,
          metaDescription: row.meta_description,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } catch (error) {
        console.error('Category query error:', error);
        throw error;
      }
    },

    rootCategories: async () => {
      try {
        const client = await pool.connect();
        
        const result = await client.query(`
          SELECT c.*, COUNT(p.id) as product_count
          FROM categories c
          LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
          WHERE c.parent_id IS NULL AND c.is_active = true
          GROUP BY c.id
          ORDER BY c.sort_order ASC, c.name ASC
        `);
        
        client.release();

        return result.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          imageUrl: row.image_url,
          isActive: row.is_active,
          sortOrder: row.sort_order,
          productCount: parseInt(row.product_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        console.error('Root categories error:', error);
        throw error;
      }
    }
  },

  Mutation: {
    createCategory: async (_, { input }, { user, req }) => {
      if (!user || !['admin', 'manager'].includes(user.role)) {
        throw new ForbiddenError('Access denied. Admin or Manager role required.');
      }

      const { name, description, parentId, isActive = true, sortOrder = 0, metaTitle, metaDescription } = input;

      try {
        const client = await pool.connect();
        
        // Generate unique slug
        const baseSlug = slugify(name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const existingSlug = await client.query('SELECT id FROM categories WHERE slug = $1', [slug]);
          if (existingSlug.rows.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Validate parent category if provided
        if (parentId) {
          const parentExists = await client.query('SELECT id FROM categories WHERE id = $1', [parentId]);
          if (parentExists.rows.length === 0) {
            throw new UserInputError('Parent category not found');
          }
        }

        const result = await client.query(`
          INSERT INTO categories (name, slug, description, parent_id, is_active, sort_order, meta_title, meta_description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [name, slug, description, parentId, isActive, sortOrder, metaTitle, metaDescription]);

        client.release();

        const category = result.rows[0];

        // Log category creation
        await logAuditEvent(
          user.id,
          'category_create',
          'category',
          category.id,
          req.ip,
          req.get('user-agent'),
          { categoryName: name, slug }
        );

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.image_url,
          isActive: category.is_active,
          sortOrder: category.sort_order,
          metaTitle: category.meta_title,
          metaDescription: category.meta_description,
          createdAt: category.created_at,
          updatedAt: category.updated_at
        };
      } catch (error) {
        console.error('Create category error:', error);
        throw error;
      }
    }
  },

  // Field resolvers
  Category: {
    children: async (parent) => {
      try {
        const client = await pool.connect();
        const result = await client.query(
          'SELECT * FROM categories WHERE parent_id = $1 AND is_active = true ORDER BY sort_order ASC, name ASC',
          [parent.id]
        );
        client.release();

        return result.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          imageUrl: row.image_url,
          isActive: row.is_active,
          sortOrder: row.sort_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (error) {
        console.error('Category children resolver error:', error);
        return [];
      }
    },

    productCount: async (parent) => {
      try {
        const client = await pool.connect();
        const result = await client.query(
          'SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = true',
          [parent.id]
        );
        client.release();
        return parseInt(result.rows[0].count);
      } catch (error) {
        console.error('Category product count resolver error:', error);
        return 0;
      }
    },

    parent: async (parent) => {
      if (!parent.parent_id) return null;
      
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM categories WHERE id = $1', [parent.parent_id]);
        client.release();
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0];
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          imageUrl: row.image_url,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } catch (error) {
        console.error('Category parent resolver error:', error);
        return null;
      }
    },

    breadcrumbs: async (parent) => {
      const breadcrumbs = [];
      let currentCategory = parent;
      
      try {
        const client = await pool.connect();
        
        while (currentCategory && currentCategory.parent_id) {
          const result = await client.query('SELECT * FROM categories WHERE id = $1', [currentCategory.parent_id]);
          if (result.rows.length === 0) break;
          
          const parentCat = result.rows[0];
          breadcrumbs.unshift({
            id: parentCat.id,
            name: parentCat.name,
            slug: parentCat.slug
          });
          
          currentCategory = parentCat;
        }
        
        client.release();
        return breadcrumbs;
      } catch (error) {
        console.error('Category breadcrumbs resolver error:', error);
        return [];
      }
    }
  }
};

module.exports = categoryResolvers;
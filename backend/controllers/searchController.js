const { query } = require('../config/database');

const searchProducts = async (req, res) => {
  try {
    const {
      q: searchQuery,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [searchQuery];
    let paramCount = 1;

    // Build search query with relevance scoring
    let selectClause = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.short_description,
        p.sku, p.price, p.compare_price, p.stock_quantity,
        p.images, p.is_featured, p.tags, p.created_at,
        c.name as category_name, c.slug as category_slug,
        -- Relevance scoring
        (
          CASE WHEN p.name ILIKE '%' || $1 || '%' THEN 10 ELSE 0 END +
          CASE WHEN p.sku ILIKE '%' || $1 || '%' THEN 8 ELSE 0 END +
          CASE WHEN p.short_description ILIKE '%' || $1 || '%' THEN 5 ELSE 0 END +
          CASE WHEN p.description ILIKE '%' || $1 || '%' THEN 3 ELSE 0 END +
          CASE WHEN $1 = ANY(p.tags) THEN 15 ELSE 0 END
        ) as relevance_score,
        COUNT(*) OVER() as total_count
    `;

    // Add search conditions
    whereConditions.push(`(
      p.name ILIKE '%' || $1 || '%' OR
      p.description ILIKE '%' || $1 || '%' OR
      p.short_description ILIKE '%' || $1 || '%' OR
      p.sku ILIKE '%' || $1 || '%' OR
      $1 = ANY(p.tags)
    )`);

    // Category filter
    if (category) {
      paramCount++;
      whereConditions.push(`c.slug = ${paramCount}`);
      queryParams.push(category);
    }

    // Price filters
    if (minPrice && !isNaN(minPrice)) {
      paramCount++;
      whereConditions.push(`p.price >= ${paramCount}`);
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      paramCount++;
      whereConditions.push(`p.price <= ${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case 'price_asc':
        orderByClause = 'ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderByClause = 'ORDER BY p.price DESC';
        break;
      case 'newest':
        orderByClause = 'ORDER BY p.created_at DESC';
        break;
      case 'name':
        orderByClause = 'ORDER BY p.name ASC';
        break;
      default: // relevance
        orderByClause = 'ORDER BY relevance_score DESC, p.is_featured DESC, p.created_at DESC';
    }

    const searchQuerySQL = `
      ${selectClause}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereConditions.join(' AND ')}
      ${orderByClause}
      LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}
    `;

    queryParams.push(limitNum, offset);

    const result = await query(searchQuerySQL, queryParams);
    const products = result.rows;
    const totalCount = products.length > 0 ? parseInt(products[0].total_count) : 0;

    // Format products for frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.short_description || product.description,
      sku: product.sku,
      price: parseFloat(product.price),
      oldPrice: product.compare_price ? parseFloat(product.compare_price) : null,
      image: product.images && product.images[0] ? product.images[0] : null,
      images: product.images || [],
      inStock: product.stock_quantity > 0,
      stockQuantity: product.stock_quantity,
      category: product.category_name,
      categorySlug: product.category_slug,
      isFeatured: product.is_featured,
      tags: product.tags || [],
      relevanceScore: product.relevance_score,
      createdAt: product.created_at
    }));

    // Set headers for pagination
    const totalPages = Math.ceil(totalCount / limitNum);
    res.set({
      'X-Total-Count': totalCount.toString(),
      'X-Page-Count': totalPages.toString(),
      'Cache-Control': 'public, max-age=300' // 5 minutes cache
    });

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        searchQuery,
        filters: {
          category,
          minPrice,
          maxPrice
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        searchTime: Date.now(), // Could track actual search time
        totalResults: totalCount
      }
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

const getSearchSuggestions = async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    
    // Get product name suggestions
    const productSuggestions = await query(`
      SELECT DISTINCT name, slug
      FROM products 
      WHERE name ILIKE '%' || $1 || '%' 
      AND is_active = TRUE
      ORDER BY 
        CASE WHEN name ILIKE $1 || '%' THEN 1 ELSE 2 END,
        LENGTH(name)
      LIMIT 8
    `, [searchQuery]);

    // Get category suggestions  
    const categorySuggestions = await query(`
      SELECT DISTINCT name, slug
      FROM categories 
      WHERE name ILIKE '%' || $1 || '%' 
      AND is_active = TRUE
      ORDER BY 
        CASE WHEN name ILIKE $1 || '%' THEN 1 ELSE 2 END,
        LENGTH(name)
      LIMIT 5
    `, [searchQuery]);

    // Get popular search terms (you could track these in a separate table)
    const suggestions = {
      products: productSuggestions.rows,
      categories: categorySuggestions.rows,
      popular: [] // Could add popular search tracking
    };

    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes cache
    
    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
};

module.exports = {
  searchProducts,
  getSearchSuggestions
};
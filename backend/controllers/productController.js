import Product from '../models/Product.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Get products with filtering, pagination, and sorting
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brands,
      minPrice,
      maxPrice,
      type,
      connector,
      cableLength,
      inStock,
      deals,
      featured,
      sort = 'newest'
    } = req.query;

    // Build filter object
    const filters = { status: 'active' };
    
    if (category) filters.categorySlug = category;
    if (brands) filters.brand = { $in: brands.split(',') };
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }
    if (type) filters['attrs.type'] = type;
    if (connector) filters['attrs.connector'] = connector;
    if (cableLength) filters['attrs.cableLength'] = cableLength;
    if (inStock === 'true') filters.inStock = { $gt: 0 };
    if (deals === 'true') filters.isDeal = true;
    if (featured === 'true') filters.isFeatured = true;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'name_asc':
        sortObj = { title: 1 };
        break;
      case 'name_desc':
        sortObj = { title: -1 };
        break;
      case 'popular':
        sortObj = { salesCount: -1, viewCount: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1, reviewCount: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filters)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      Product.countDocuments(filters)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      items: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        applied: Object.keys(req.query).filter(key => !['page', 'limit', 'sort'].includes(key)),
        available: await getAvailableFilters(filters)
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    next(new AppError('Failed to fetch products', 500));
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id).select('-__v');
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.status !== 'active') {
      return next(new AppError('Product not available', 404));
    }

    // Increment view count asynchronously
    product.incrementViewCount().catch(err => 
      logger.warn('Failed to increment view count:', err)
    );

    res.json(product);

  } catch (error) {
    logger.error('Error fetching product by ID:', error);
    next(new AppError('Failed to fetch product', 500));
  }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const product = await Product.findOne({ 
      slug, 
      status: 'active' 
    }).select('-__v');
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Increment view count asynchronously
    product.incrementViewCount().catch(err => 
      logger.warn('Failed to increment view count:', err)
    );

    res.json(product);

  } catch (error) {
    logger.error('Error fetching product by slug:', error);
    next(new AppError('Failed to fetch product', 500));
  }
};

/**
 * Get multiple products by IDs
 */
export const getProductsBatch = async (req, res, next) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return next(new AppError('Product IDs are required', 400));
    }

    const productIds = ids.split(',').filter(id => id.trim());
    
    if (productIds.length === 0) {
      return res.json([]);
    }

    if (productIds.length > 50) {
      return next(new AppError('Too many products requested. Maximum 50 allowed.', 400));
    }

    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    }).select('-__v').lean();

    res.json(products);

  } catch (error) {
    logger.error('Error fetching products batch:', error);
    next(new AppError('Failed to fetch products', 500));
  }
};

/**
 * Search products by text
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    const limitNum = Math.min(parseInt(limit), 50);

    // Text search with scoring
    const products = await Product.find(
      { 
        $text: { $search: query },
        status: 'active'
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' }, salesCount: -1 })
    .limit(limitNum)
    .select('-__v')
    .lean();

    res.json({
      query,
      results: products,
      count: products.length
    });

  } catch (error) {
    logger.error('Error searching products:', error);
    next(new AppError('Search failed', 500));
  }
};

/**
 * Get related products
 */
export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 8 } = req.query;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const limitNum = Math.min(parseInt(limit), 20);

    // Find related products by category and brand
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      status: 'active',
      $or: [
        { categorySlug: product.categorySlug },
        { brand: product.brand },
        { 'attrs.type': product.attrs?.type }
      ]
    })
    .sort({ salesCount: -1, createdAt: -1 })
    .limit(limitNum)
    .select('-__v')
    .lean();

    res.json(relatedProducts);

  } catch (error) {
    logger.error('Error fetching related products:', error);
    next(new AppError('Failed to fetch related products', 500));
  }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 12 } = req.query;
    const limitNum = Math.min(parseInt(limit), 20);

    const products = await Product.find({
      status: 'active',
      isFeatured: true
    })
    .sort({ salesCount: -1, createdAt: -1 })
    .limit(limitNum)
    .select('-__v')
    .lean();

    res.json(products);

  } catch (error) {
    logger.error('Error fetching featured products:', error);
    next(new AppError('Failed to fetch featured products', 500));
  }
};

/**
 * Helper function to get available filter options
 */
const getAvailableFilters = async (currentFilters = {}) => {
  try {
    const baseFilter = { status: 'active', ...currentFilters };
    
    // Remove price filter to get full range
    delete baseFilter.price;
    
    const [
      priceRange,
      brands,
      types,
      connectors,
      cableLengths
    ] = await Promise.all([
      Product.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ]),
      Product.distinct('brand', baseFilter),
      Product.distinct('attrs.type', baseFilter),
      Product.distinct('attrs.connector', baseFilter),
      Product.distinct('attrs.cableLength', baseFilter)
    ]);

    return {
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
      brands: brands.filter(Boolean).sort(),
      types: types.filter(Boolean).sort(),
      connectors: connectors.filter(Boolean).sort(),
      cableLengths: cableLengths.filter(Boolean).sort()
    };

  } catch (error) {
    logger.error('Error getting available filters:', error);
    return {
      priceRange: { minPrice: 0, maxPrice: 1000 },
      brands: [],
      types: [],
      connectors: [],
      cableLengths: []
    };
  }
};
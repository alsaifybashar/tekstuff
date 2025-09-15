import mongoose from 'mongoose';
import slug from 'slug';

const productSchema = new mongoose.Schema({
  // Basic product information
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Brand and category
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  
  categorySlug: {
    type: String,
    index: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  
  oldPrice: {
    type: Number,
    min: [0, 'Old price cannot be negative'],
    validate: {
      validator: function(v) {
        return v == null || (Number.isFinite(v) && v >= this.price);
      },
      message: 'Old price must be greater than current price'
    }
  },
  
  // Inventory
  inStock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  
  // Images
  image: {
    type: String,
    required: [true, 'Main image is required']
  },
  
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v.startsWith('http') || v.startsWith('/');
      },
      message: 'Image URL must be valid'
    }
  }],
  
  // Product attributes for filtering
  attrs: {
    type: {
      type: String,
      enum: ['cable', 'charger', 'adapter', 'wireless-charger', 'power-bank', 'accessory'],
      index: true
    },
    
    connector: {
      type: String,
      enum: ['usb-c', 'lightning', 'micro-usb', 'usb-a', 'wireless', 'magsafe'],
      index: true
    },
    
    cableLength: {
      type: String,
      enum: ['0.3m', '1m', '1.5m', '2m', '3m', '5m'],
      index: true
    },
    
    power: {
      type: String, // e.g., "20W", "65W", "100W"
    },
    
    color: {
      type: String,
      default: 'white'
    },
    
    material: String,
    
    compatibility: [String], // e.g., ["iPhone", "Samsung", "iPad"]
    
    features: [String] // e.g., ["Fast Charging", "Data Transfer", "Durable"]
  },
  
  // SEO and metadata
  metaTitle: String,
  metaDescription: String,
  tags: [String],
  
  // Product status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
    index: true
  },
  
  // Flags
  isDeal: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isNewArrival: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });
productSchema.index({ salesCount: -1, status: 1 });
productSchema.index({ isDeal: 1, status: 1 });
productSchema.index({ 'attrs.type': 1, status: 1 });
productSchema.index({ 'attrs.connector': 1, status: 1 });

// Text search index
productSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (!this.oldPrice || this.oldPrice <= this.price) return 0;
  return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.inStock > 0;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slug(this.title, { lower: true });
  }
  
  if (this.isModified('category')) {
    this.categorySlug = slug(this.category, { lower: true });
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to find products with filters
productSchema.statics.findWithFilters = function(filters = {}) {
  const query = { status: 'active' };
  
  // Category filter
  if (filters.category) {
    query.categorySlug = filters.category;
  }
  
  // Brand filter
  if (filters.brands && filters.brands.length > 0) {
    query.brand = { $in: filters.brands };
  }
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  
  // Attribute filters
  if (filters.type) query['attrs.type'] = filters.type;
  if (filters.connector) query['attrs.connector'] = filters.connector;
  if (filters.cableLength) query['attrs.cableLength'] = filters.cableLength;
  
  // Stock filter
  if (filters.inStock) {
    query.inStock = { $gt: 0 };
  }
  
  // Deals filter
  if (filters.deals) {
    query.isDeal = true;
  }
  
  // Search query
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  return this.find(query);
};

// Method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to update sales count
productSchema.methods.recordSale = function(quantity = 1) {
  this.salesCount += quantity;
  this.inStock = Math.max(0, this.inStock - quantity);
  return this.save({ validateBeforeSave: false });
};

const Product = mongoose.model('Product', productSchema);

export default Product;
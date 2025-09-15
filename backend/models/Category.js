import mongoose from 'mongoose';
import slug from 'slug';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  image: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('http') || v.startsWith('/');
      },
      message: 'Image URL must be valid'
    }
  },
  
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  
  path: {
    type: String,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  metaTitle: String,
  metaDescription: String,
  
  createdAt: {
    type: Date,
    default: Date.now
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

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: 'slug',
  foreignField: 'categorySlug',
  count: true,
  match: { status: 'active' }
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  // Always generate slug from name if name exists
  if (this.name) {
    this.slug = slug(this.name, { lower: true });
  }
  
  this.updatedAt = new Date();
  next();
});

// Pre-validate middleware to ensure slug exists
categorySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = slug(this.name, { lower: true });
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('productCount');
  
  const buildTree = (parentId = null, level = 0) => {
    return categories
      .filter(cat => String(cat.parent) === String(parentId))
      .map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat._id, level + 1)
      }));
  };
  
  return buildTree();
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
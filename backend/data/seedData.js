import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';
import slug from 'slug';

dotenv.config();

// Sample categories with pre-generated slugs
const categories = [
  {
    name: 'Laddare',
    slug: 'laddare',
    description: 'Snabbladdare och väggadaptrar för alla enheter',
    image: '/images/categories/chargers.jpg',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Kablar',
    slug: 'kablar',
    description: 'USB-C, Lightning och Micro-USB kablar',
    image: '/images/categories/cables.jpg',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Trådlösa Laddare',
    slug: 'tradlosa-laddare',
    description: 'Trådlösa laddningsplattor och ställ',
    image: '/images/categories/wireless.jpg',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Powerbanks',
    slug: 'powerbanks',
    description: 'Bärbara batterier för resan',
    image: '/images/categories/powerbanks.jpg',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Tillbehör',
    slug: 'tillbehor',
    description: 'Övriga telefontillbehör',
    image: '/images/categories/accessories.jpg',
    isActive: true,
    sortOrder: 5
  }
];

// Sample products matching your frontend structure
const products = [
  // USB-C Chargers
  {
    title: 'Apple 20W USB-C Snabbladdare',
    brand: 'Apple',
    category: 'Laddare',
    price: 249,
    oldPrice: 299,
    inStock: 45,
    image: '/images/products/apple-20w-charger.jpg',
    images: [
      '/images/products/apple-20w-charger.jpg',
      '/images/products/apple-20w-charger-2.jpg'
    ],
    description: 'Officiell Apple 20W USB-C snabbladdare. Perfekt för iPhone 12 och senare modeller.',
    attrs: {
      type: 'charger',
      connector: 'usb-c',
      power: '20W',
      color: 'white',
      compatibility: ['iPhone', 'iPad'],
      features: ['Fast Charging', 'Compact Design']
    },
    isDeal: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 324,
    metaTitle: 'Apple 20W USB-C Snabbladdare - Officiell Apple Laddare',
    metaDescription: 'Köp den officiella Apple 20W USB-C snabbladdaren. Snabb leverans och bästa pris.',
    tags: ['apple', 'usb-c', 'snabbladdare', '20w']
  },
  {
    title: 'Samsung 25W Super Fast Charger',
    brand: 'Samsung',
    category: 'Laddare',
    price: 199,
    inStock: 32,
    image: '/images/products/samsung-25w-charger.jpg',
    description: 'Samsung Super Fast Charger med 25W USB-C utgang.',
    attrs: {
      type: 'charger',
      connector: 'usb-c',
      power: '25W',
      color: 'white',
      compatibility: ['Samsung Galaxy'],
      features: ['Super Fast Charging', 'Adaptive Fast Charging']
    },
    isFeatured: true,
    rating: 4.6,
    reviewCount: 156
  },
  {
    title: 'Anker PowerPort III 65W',
    brand: 'Anker',
    category: 'Laddare',
    price: 449,
    oldPrice: 549,
    inStock: 28,
    image: '/images/products/anker-65w-charger.jpg',
    description: 'Kompakt 65W GaN laddare för laptops och telefoner.',
    attrs: {
      type: 'charger',
      connector: 'usb-c',
      power: '65W',
      color: 'black',
      compatibility: ['MacBook', 'iPhone', 'Samsung', 'Dell'],
      features: ['GaN Technology', 'Foldable Plug', 'Universal Compatibility']
    },
    isDeal: true,
    rating: 4.9,
    reviewCount: 89
  },

  // Cables
  {
    title: 'Apple Lightning till USB-C Kabel 1m',
    brand: 'Apple',
    category: 'Kablar',
    price: 199,
    inStock: 67,
    image: '/images/products/apple-lightning-usbc-1m.jpg',
    description: 'Officiell Apple Lightning till USB-C kabel för snabbladdning.',
    attrs: {
      type: 'cable',
      connector: 'lightning',
      cableLength: '1m',
      color: 'white',
      compatibility: ['iPhone', 'iPad'],
      features: ['Fast Charging', 'Data Transfer', 'Durable']
    },
    isFeatured: true,
    rating: 4.7,
    reviewCount: 445
  },
  {
    title: 'USB-C till USB-C Kabel 2m',
    brand: 'Belkin',
    category: 'Kablar',
    price: 149,
    inStock: 89,
    image: '/images/products/belkin-usbc-2m.jpg',
    description: 'Belkin USB-C till USB-C kabel med stöd för 100W laddning.',
    attrs: {
      type: 'cable',
      connector: 'usb-c',
      cableLength: '2m',
      color: 'black',
      compatibility: ['MacBook', 'Samsung', 'Google Pixel'],
      features: ['100W Power Delivery', 'Data Transfer', 'Reinforced']
    },
    rating: 4.5,
    reviewCount: 234
  },
  {
    title: 'Anker Powerline III Lightning 3m',
    brand: 'Anker',
    category: 'Kablar',
    price: 179,
    oldPrice: 229,
    inStock: 54,
    image: '/images/products/anker-lightning-3m.jpg',
    description: 'Extra lång Lightning kabel med livstidsgaranti.',
    attrs: {
      type: 'cable',
      connector: 'lightning',
      cableLength: '3m',
      color: 'black',
      compatibility: ['iPhone', 'iPad'],
      features: ['Lifetime Warranty', 'Reinforced', 'Fast Charging']
    },
    isDeal: true,
    rating: 4.8,
    reviewCount: 167
  },

  // Wireless Chargers
  {
    title: 'Apple MagSafe Laddare',
    brand: 'Apple',
    category: 'Trådlösa Laddare',
    price: 449,
    inStock: 23,
    image: '/images/products/apple-magsafe-charger.jpg',
    description: 'Officiell Apple MagSafe trådlös laddare för iPhone 12 och senare.',
    attrs: {
      type: 'wireless-charger',
      connector: 'wireless',
      power: '15W',
      color: 'white',
      compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'],
      features: ['MagSafe', 'Perfect Alignment', 'Fast Wireless Charging']
    },
    isFeatured: true,
    rating: 4.6,
    reviewCount: 289
  },
  {
    title: 'Samsung Wireless Charger Duo',
    brand: 'Samsung',
    category: 'Trådlösa Laddare',
    price: 599,
    oldPrice: 699,
    inStock: 18,
    image: '/images/products/samsung-wireless-duo.jpg',
    description: 'Ladda två enheter samtidigt med Samsung Wireless Charger Duo.',
    attrs: {
      type: 'wireless-charger',
      connector: 'wireless',
      power: '15W',
      color: 'black',
      compatibility: ['Samsung Galaxy', 'iPhone', 'Galaxy Buds'],
      features: ['Dual Charging', 'Fast Wireless Charging', 'LED Indicator']
    },
    isDeal: true,
    rating: 4.4,
    reviewCount: 124
  },

  // Power Banks
  {
    title: 'Anker PowerCore 10000mAh',
    brand: 'Anker',
    category: 'Powerbanks',
    price: 299,
    inStock: 41,
    image: '/images/products/anker-powercore-10k.jpg',
    description: 'Kompakt powerbank med 10000mAh kapacitet.',
    attrs: {
      type: 'power-bank',
      connector: 'usb-a',
      power: '12W',
      color: 'black',
      compatibility: ['iPhone', 'Samsung', 'Android'],
      features: ['Compact Size', 'Multiple Charges', 'PowerIQ Technology']
    },
    isFeatured: true,
    rating: 4.7,
    reviewCount: 356
  },
  {
    title: 'RAVPower 20000mAh PD Powerbank',
    brand: 'RAVPower',
    category: 'Powerbanks',
    price: 549,
    oldPrice: 649,
    inStock: 27,
    image: '/images/products/ravpower-20k-pd.jpg',
    description: 'Kraftfull powerbank med USB-C Power Delivery.',
    attrs: {
      type: 'power-bank',
      connector: 'usb-c',
      power: '60W',
      color: 'black',
      compatibility: ['MacBook', 'iPhone', 'Samsung', 'Nintendo Switch'],
      features: ['Power Delivery', 'Quick Charge', 'Digital Display']
    },
    isDeal: true,
    rating: 4.5,
    reviewCount: 98
  },

  // Accessories
  {
    title: 'Spigen Tough Armor MagSafe Fodral',
    brand: 'Spigen',
    category: 'Tillbehör',
    price: 349,
    inStock: 62,
    image: '/images/products/spigen-tough-armor.jpg',
    description: 'Robust skydd med MagSafe kompatibilitet.',
    attrs: {
      type: 'accessory',
      color: 'black',
      compatibility: ['iPhone 14', 'iPhone 15'],
      features: ['MagSafe Compatible', 'Drop Protection', 'Kickstand']
    },
    rating: 4.6,
    reviewCount: 178
  },
  {
    title: 'Belkin 3-i-1 Trådlös Laddningsstation',
    brand: 'Belkin',
    category: 'Trådlösa Laddare',
    price: 1299,
    oldPrice: 1499,
    inStock: 15,
    image: '/images/products/belkin-3in1-station.jpg',
    description: 'Ladda iPhone, Apple Watch och AirPods samtidigt.',
    attrs: {
      type: 'wireless-charger',
      connector: 'wireless',
      power: '15W',
      color: 'white',
      compatibility: ['iPhone', 'Apple Watch', 'AirPods'],
      features: ['3-in-1 Charging', 'MagSafe', 'Apple Watch Stand']
    },
    isDeal: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 145
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webshop');
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    logger.info('Cleared existing data');

    // Insert categories one by one to handle any slug conflicts
    const insertedCategories = [];
    for (const categoryData of categories) {
      try {
        // Ensure slug is generated
        if (!categoryData.slug) {
          categoryData.slug = slug(categoryData.name, { lower: true });
        }
        
        const category = new Category(categoryData);
        const saved = await category.save();
        insertedCategories.push(saved);
        logger.info(`Inserted category: ${saved.name} (${saved.slug})`);
      } catch (error) {
        logger.error(`Failed to insert category ${categoryData.name}:`, error.message);
      }
    }

    logger.info(`Inserted ${insertedCategories.length} categories`);

    // Map category names to slugs for products
    const categoryMap = {};
    insertedCategories.forEach(cat => {
      categoryMap[cat.name] = cat.slug;
    });

    // Update products with category slugs and generate slugs
    const productsWithSlugs = products.map(product => ({
      ...product,
      slug: slug(product.title, { lower: true }),
      categorySlug: categoryMap[product.category] || 'other'
    }));

    // Insert products
    const insertedProducts = await Product.insertMany(productsWithSlugs);
    logger.info(`Inserted ${insertedProducts.length} products`);

    // Add some sample sales and view data
    const updatePromises = insertedProducts.map(async (product, index) => {
      const randomSales = Math.floor(Math.random() * 100) + 10;
      const randomViews = Math.floor(Math.random() * 500) + 50;
      
      return Product.findByIdAndUpdate(product._id, {
        $set: {
          salesCount: randomSales,
          viewCount: randomViews
        }
      });
    });

    await Promise.all(updatePromises);
    logger.info('Updated products with sample analytics data');

    logger.info('✅ Database seeded successfully!');
    logger.info('📊 Summary:');
    logger.info(`   - ${insertedCategories.length} categories`);
    logger.info(`   - ${insertedProducts.length} products`);
    logger.info(`   - ${insertedProducts.filter(p => p.isDeal).length} deals`);
    logger.info(`   - ${insertedProducts.filter(p => p.isFeatured).length} featured products`);

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
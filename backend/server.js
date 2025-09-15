import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

// Load environment variables
dotenv.config();

// Import configurations and middleware
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import corsMiddleware from './middleware/cors.js';
import rateLimitMiddleware from './middleware/rateLimit.js';
import securityMiddleware from './middleware/security.js';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './utils/errors.js';

// Import routes
import indexRoutes from './routes/index.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Async function to start the server
const startServer = async () => {
  try {
    // Database connections
    await connectDB();
    
    // Try Redis connection but don't fail if it's not available
    try {
      await connectRedis();
    } catch (redisError) {
      logger.warn('⚠️  Redis connection failed, continuing without cache:', redisError.message);
    }

    // Trust proxy for secure headers (important for Vercel)
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    app.use(compression());
    app.use(mongoSanitize());
    app.use(corsMiddleware);
    app.use(rateLimitMiddleware);
    app.use(securityMiddleware);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    app.use('/uploads', express.static('uploads'));

    // Request logging in development
    if (process.env.NODE_ENV === 'development') {
      app.use((req, res, next) => {
        logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
        next();
      });
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes
    app.use('/', indexRoutes);
    app.use(`/${process.env.API_VERSION || 'v1'}/products`, productRoutes);
    app.use(`/${process.env.API_VERSION || 'v1'}/categories`, categoryRoutes);
    app.use(`/${process.env.API_VERSION || 'v1'}/cart`, cartRoutes);
    app.use(`/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
    app.use(`/${process.env.API_VERSION || 'v1'}/admin`, adminRoutes);

    // Error handling
    app.use(notFound);
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📍 API base URL: http://localhost:${PORT}/${process.env.API_VERSION || 'v1'}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;
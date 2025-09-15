import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

export const connectRedis = async () => {
  try {
    // Create Redis client
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('🔄 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis connection ready');
    });

    redisClient.on('end', () => {
      logger.warn('🔚 Redis connection ended');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    // Attempt to connect
    try {
      await redisClient.connect();
      
      // Test the connection
      await redisClient.ping();
      logger.info('📡 Redis ping successful');
      
      return redisClient;
    } catch (error) {
      logger.warn(`⚠️  Redis connection failed: ${error.message}`);
      logger.info('💡 Running without Redis cache. Install Redis for better performance.');
      
      // Don't throw error - allow app to run without Redis
      return null;
    }

  } catch (error) {
    logger.warn(`⚠️  Redis setup failed: ${error.message}`);
    logger.info('💡 Continuing without Redis. Cache functionality will be disabled.');
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('🔐 Redis connection closed');
    } catch (error) {
      logger.warn('Error closing Redis connection:', error.message);
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeRedis();
});

process.on('SIGINT', async () => {
  await closeRedis();
});
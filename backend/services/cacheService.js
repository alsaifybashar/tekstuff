import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('📡 Redis client ready');
    });

    redisClient.on('end', () => {
      logger.warn('🔚 Redis connection ended');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    // Don't exit process, just disable caching
    return null;
  }
};

// Get Redis client (initialize if needed)
const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await initRedis();
  }
  return redisClient;
};

// Cache middleware factory
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching in development or if Redis unavailable
    if (process.env.NODE_ENV === 'development' || !redisClient) {
      return next();
    }

    try {
      const client = await getRedisClient();
      if (!client) return next();

      // Generate cache key
      const cacheKey = `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      // Try to get from cache
      const cachedData = await client.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        const parsed = JSON.parse(cachedData);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${duration}`,
          'ETag': `"${Buffer.from(cachedData).toString('base64').slice(0, 32)}"`
        });
        
        return res.json(parsed);
      }

      // Cache miss - proceed to route handler
      logger.debug(`Cache MISS for key: ${cacheKey}`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.setEx(cacheKey, duration, JSON.stringify(data))
            .catch(err => logger.warn('Failed to cache response:', err));
        }
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${duration}`
        });
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.warn('Cache middleware error:', error);
      // Continue without caching
      next();
    }
  };
};

// Cache service functions
export const cacheService = {
  // Get from cache
  async get(key) {
    try {
      const client = await getRedisClient();
      if (!client) return null;
      
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  },

  // Set cache with expiration
  async set(key, value, ttl = 300) {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('Cache set error:', error);
      return false;
    }
  },

  // Delete from cache
  async del(key) {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      logger.warn('Cache delete error:', error);
      return false;
    }
  },

  // Delete cache keys by pattern
  async delPattern(pattern) {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.warn('Cache delete pattern error:', error);
      return 0;
    }
  },

  // Clear all cache
  async clear() {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      
      await client.flushDb();
      return true;
    } catch (error) {
      logger.warn('Cache clear error:', error);
      return false;
    }
  },

  // Check if Redis is available
  async isAvailable() {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Initialize on import
initRedis();

export default cacheService;
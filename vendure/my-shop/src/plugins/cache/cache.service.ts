import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
    constructor(
        @Inject('REDIS_CLIENT') private redis: Redis,
    ) {}

    async get<T>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);
        if (!value) return null;
        
        try {
            return JSON.parse(value);
        } catch {
            return value as any;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (ttl) {
            await this.redis.set(key, serialized, 'EX', ttl);
        } else {
            await this.redis.set(key, serialized);
        }
    }

    async invalidate(pattern: string): Promise<void> {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    async invalidateProductCache(productId: string): Promise<void> {
        await this.invalidate(`product:${productId}:*`);
        await this.invalidate(`category:*:products`);
        await this.invalidate(`search:*`);
    }

    async warmupCache(): Promise<void> {
        // Preload frequently accessed data
        console.log('Warming up cache...');
        // Implementation depends on your specific needs
    }
}
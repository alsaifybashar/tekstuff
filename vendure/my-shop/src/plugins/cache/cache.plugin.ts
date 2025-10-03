import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import Redis from 'ioredis';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        CacheService,
        {
            provide: 'REDIS_CLIENT',
            useFactory: () => {
                return new Redis({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: Number(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD,
                    db: 0,
                    retryStrategy: (times: number) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                });
            },
        },
    ],
    configuration: config => config,
})
export class CachePlugin {}
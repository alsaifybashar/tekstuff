import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { RequestContext, TransactionalConnection, User } from '@vendure/core';
import { AuditLog } from './audit-log.entity';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class SecurityService {
    private rateLimiter: RateLimiterRedis;
    
    constructor(
        private connection: TransactionalConnection,
    ) {
        const redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: +process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
        });

        this.rateLimiter = new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: 'rate_limit',
            points: 100, // Number of requests
            duration: 60, // Per 60 seconds
            blockDuration: 60 * 10, // Block for 10 minutes
        });
    }

    async logAuditEvent(
        ctx: RequestContext,
        event: {
            action: string;
            entity: string;
            entityId?: string;
            userId?: string;
            ipAddress?: string;
            userAgent?: string;
            metadata?: any;
        }
    ): Promise<AuditLog> {
        const log = new AuditLog();
        log.action = event.action;
        log.entity = event.entity;
        log.entityId = event.entityId;
        log.userId = event.userId || ctx.activeUserId?.toString();
        log.ipAddress = event.ipAddress;
        log.userAgent = event.userAgent;
        log.metadata = event.metadata;
        log.timestamp = new Date();

        return this.connection
            .getRepository(ctx, AuditLog)
            .save(log);
    }

    async checkRateLimit(key: string): Promise<boolean> {
        try {
            await this.rateLimiter.consume(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    async validatePasswordStrength(password: string): Promise<{
        isValid: boolean;
        errors: string[];
    }> {
        const errors: string[] = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    generateTwoFactorSecret(user: User): string {
        const secret = speakeasy.generateSecret({
            name: `YourShop (${user.identifier})`,
            length: 32,
        });
        
        return secret.base32;
    }

    verifyTwoFactorToken(secret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });
    }

    sanitizeInput(input: any): any {
        if (typeof input === 'string') {
            // Remove potential XSS vectors
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        }
        
        if (typeof input === 'object') {
            const sanitized: any = {};
            for (const key in input) {
                sanitized[key] = this.sanitizeInput(input[key]);
            }
            return sanitized;
        }
        
        return input;
    }
}
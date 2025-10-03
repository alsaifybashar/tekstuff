import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configurations for different endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Strict limit for auth endpoints
    skipSuccessfulRequests: true,
});

export const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 checkouts per hour
});

// Security headers configuration
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: !process.env.IS_DEV,
});

// IP whitelist/blacklist middleware
export class IPFilterMiddleware {
    private blacklist: Set<string> = new Set();
    private whitelist: Set<string> = new Set();

    constructor() {
        // Load from environment or database
        const blacklistIPs = process.env.IP_BLACKLIST?.split(',') || [];
        const whitelistIPs = process.env.IP_WHITELIST?.split(',') || [];
        
        blacklistIPs.forEach(ip => this.blacklist.add(ip.trim()));
        whitelistIPs.forEach(ip => this.whitelist.add(ip.trim()));
    }

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const clientIP = req.ip || req.socket.remoteAddress || '';
            
            // Check blacklist
            if (this.blacklist.has(clientIP)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            // If whitelist is not empty, only allow whitelisted IPs
            if (this.whitelist.size > 0 && !this.whitelist.has(clientIP)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            next();
        };
    }
}
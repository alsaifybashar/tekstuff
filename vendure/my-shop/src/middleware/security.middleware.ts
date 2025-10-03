import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Helmet for security headers
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        })(req, res, () => {});

        // Prevent HTTP Parameter Pollution
        hpp()(req, res, () => {});

        // Custom security checks
        // Check for SQL injection patterns
        const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi;
        const url = req.url + JSON.stringify(req.body || {});
        
        if (sqlPattern.test(url)) {
            console.warn(`Potential SQL injection attempt from IP: ${req.ip}`);
            return res.status(400).json({ error: 'Invalid request' });
        }

        next();
    }
}
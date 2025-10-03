import { PluginCommonModule, VendurePlugin, OnApplicationBootstrap } from '@vendure/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SecurityService implements OnApplicationBootstrap {
    onApplicationBootstrap() {
        console.log('Security plugin initialized');
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [SecurityService],
    configuration: config => {
        // Add security headers
        config.apiOptions.middleware = [
            {
                route: '*',
                handler: (req: any, res: any, next: any) => {
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'DENY');
                    res.setHeader('X-XSS-Protection', '1; mode=block');
                    next();
                },
            },
        ];
        return config;
    },
})
export class SecurityPlugin {}
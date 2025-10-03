import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

runMigrations(config)
    .then(() => bootstrap(config))
    .then(app => {
        const port = config.apiOptions.port;
        console.log(`🚀 Vendure server started on port ${port}`);
        console.log(`📊 Admin UI: http://localhost:3002/admin`);
        console.log(`🛍️  Shop API: http://localhost:${port}/shop-api`);
        console.log(`🔐 Admin API: http://localhost:${port}/admin-api`);
        
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server');
            await app.close();
            process.exit(0);
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
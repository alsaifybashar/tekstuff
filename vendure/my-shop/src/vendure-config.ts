import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    VendureConfig,
    LanguageCode,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import 'dotenv/config';
import path from 'path';

import { ProductEnhancementPlugin } from './plugins/product-enhacement/product-enhancement.plugin';
import { SecurityPlugin } from './plugins/security/security.plugin';
import { B2BPlugin } from './plugins/b2b/b2b.plugin';


const IS_DEV = process.env.APP_ENV === 'dev';

export const config: VendureConfig = {
    apiOptions: {
        port: +process.env.PORT || 3000,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET || 'changeme',
        },
    },
    dbConnectionOptions: {
        type: 'better-sqlite3',
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: path.join(__dirname, '../vendure.sqlite'),
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {
        Product: [
            {
                name: 'technicalSpecs',
                type: 'text',
                label: [{ languageCode: LanguageCode.en, value: 'Technical Specifications' }],
            },
            {
                name: 'warrantyInfo',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Warranty Information' }],
            },
            {
                name: 'manufacturer',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Manufacturer' }],
            },
        ],
        ProductVariant: [
            {
                name: 'color',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Color' }],
            },
            {
                name: 'voltage',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Voltage' }],
            },
        ],
        Customer: [
            {
                name: 'isB2b',
                type: 'boolean',
                defaultValue: false,
                label: [{ languageCode: LanguageCode.en, value: 'B2B Customer' }],
            },
            {
                name: 'companyName',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Company Name' }],
                nullable: true,
            },
        ],
    },
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            assetUrlPrefix: IS_DEV ? undefined : 'https://www.my-shop.com/assets/',
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                fromAddress: '"Example Store" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change',
            },
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
        }),
    ],
};
import { LanguageCode, CustomFields } from '@vendure/core';

export const customFields: CustomFields = {
    Product: [
        {
            name: 'specifications',
            type: 'text',
            label: [
                { languageCode: LanguageCode.en, value: 'Technical Specifications' },
            ],
            public: true,
            nullable: true,
            ui: {
                component: 'rich-text-form-input',
            },
        },
        {
            name: 'warranty',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Warranty Period' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'brand',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Brand' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'manufacturer',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Manufacturer' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'weight',
            type: 'float',
            label: [
                { languageCode: LanguageCode.en, value: 'Weight (kg)' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'dimensions',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Dimensions (L×W×H)' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'featured',
            type: 'boolean',
            label: [
                { languageCode: LanguageCode.en, value: 'Featured Product' },
            ],
            public: true,
            defaultValue: false,
        },
        {
            name: 'metaTitle',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'SEO Meta Title' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'metaDescription',
            type: 'text',
            label: [
                { languageCode: LanguageCode.en, value: 'SEO Meta Description' },
            ],
            public: true,
            nullable: true,
        },
    ],

    ProductVariant: [
        {
            name: 'sku',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'SKU' },
            ],
            public: true,
            nullable: true,
            unique: true,
        },
        {
            name: 'barcode',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Barcode/EAN' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'lowStockThreshold',
            type: 'int',
            label: [
                { languageCode: LanguageCode.en, value: 'Low Stock Alert Threshold' },
            ],
            public: false,
            defaultValue: 10,
        },
    ],

    Customer: [
        {
            name: 'isB2b',
            type: 'boolean',
            label: [
                { languageCode: LanguageCode.en, value: 'B2B Customer' },
            ],
            public: false,
            defaultValue: false,
        },
        {
            name: 'companyName',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Company Name' },
            ],
            public: false,
            nullable: true,
        },
        {
            name: 'taxId',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Tax ID / VAT Number' },
            ],
            public: false,
            nullable: true,
        },
        {
            name: 'creditLimit',
            type: 'int',
            label: [
                { languageCode: LanguageCode.en, value: 'Credit Limit' },
            ],
            public: false,
            nullable: true,
        },
        {
            name: 'paymentTerms',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Payment Terms' },
            ],
            public: false,
            nullable: true,
        },
    ],

    Order: [
        {
            name: 'notes',
            type: 'text',
            label: [
                { languageCode: LanguageCode.en, value: 'Order Notes' },
            ],
            public: false,
            nullable: true,
        },
        {
            name: 'deliveryDate',
            type: 'datetime',
            label: [
                { languageCode: LanguageCode.en, value: 'Requested Delivery Date' },
            ],
            public: false,
            nullable: true,
        },
        {
            name: 'purchaseOrderNumber',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'PO Number' },
            ],
            public: false,
            nullable: true,
        },
    ],

    Collection: [
        {
            name: 'metaTitle',
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'SEO Meta Title' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'metaDescription',
            type: 'text',
            label: [
                { languageCode: LanguageCode.en, value: 'SEO Meta Description' },
            ],
            public: true,
            nullable: true,
        },
        {
            name: 'featured',
            type: 'boolean',
            label: [
                { languageCode: LanguageCode.en, value: 'Featured Collection' },
            ],
            public: true,
            defaultValue: false,
        },
    ],
};
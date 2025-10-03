// src/plugins/b2b/b2b.plugin.ts

import { 
    PluginCommonModule, 
    VendurePlugin,
    RequestContext,
    TransactionalConnection,
    ID,
    Customer,
    Order,
    ProductVariant,
    LanguageCode,
    EntityHydrator,
    CustomerService,
    OrderService,
    ProductVariantService,
    EventBus,
    OrderPlacedEvent,
    CustomerEvent
} from '@vendure/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { Ctx, Allow, Permission } from '@vendure/core';
import { gql } from 'graphql-tag';
import { DeepPartial } from 'typeorm';

// Extend the CustomCustomerFields interface to include isB2B and companyName
declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomCustomerFields {
        isB2b?: boolean;
        companyName?: string;
    }
}

// Entity definitions for B2B features
export class CompanyAccount {
    id: ID;
    name: string;
    taxId: string;
    creditLimit: number;
    currentCredit: number;
    paymentTerms: string;
    discountTier: number;
    approvalRequired: boolean;
    primaryContactEmail: string;
    primaryContactPhone: string;
    status: 'pending' | 'approved' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
}

export class BulkPricing {
    productVariantId: ID;
    minQuantity: number;
    maxQuantity: number | null;
    pricePerUnit: number;
    discountPercent: number;
}

export class QuoteRequest {
    id: ID;
    companyAccountId: ID;
    items: QuoteItem[];
    status: 'pending' | 'sent' | 'accepted' | 'rejected';
    validUntil: Date;
    totalAmount: number;
    notes: string;
    createdAt: Date;
}

export class QuoteItem {
    productVariantId: ID;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

// Service for B2B operations
@Injectable()
export class B2BService implements OnModuleInit {
    private companyAccounts: Map<ID, CompanyAccount> = new Map();
    private bulkPricing: Map<ID, BulkPricing[]> = new Map();
    private quoteRequests: Map<ID, QuoteRequest> = new Map();

    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private productVariantService: ProductVariantService,
        private orderService: OrderService,
        private eventBus: EventBus,
        private entityHydrator: EntityHydrator
    ) {}

    async onModuleInit() {
        // Initialize B2B data structures
        console.log('B2B Plugin initialized');
        
        // Subscribe to order events for credit management
        this.eventBus.ofType(OrderPlacedEvent).subscribe(async (event) => {
            await this.updateCompanyCredit(event.ctx, event.order);
        });
    }

    async createCompanyAccount(
        ctx: RequestContext,
        input: {
            customerId: ID;
            name: string;
            taxId: string;
            contactEmail: string;
            contactPhone: string;
            creditLimit?: number;
        }
    ): Promise<CompanyAccount> {
        // Validate tax ID format (simple validation - enhance as needed)
        if (!this.validateTaxId(input.taxId)) {
            throw new Error('Invalid tax ID format');
        }

        // Check if company already exists
        const existingCompany = Array.from(this.companyAccounts.values())
            .find(acc => acc.taxId === input.taxId);
        
        if (existingCompany) {
            throw new Error('Company with this tax ID already exists');
        }

        // Create new company account
        const account: CompanyAccount = {
            id: Math.random().toString(36).substr(2, 9), // Simple ID generation
            name: input.name,
            taxId: input.taxId,
            creditLimit: input.creditLimit || 10000,
            currentCredit: 0,
            paymentTerms: 'NET30',
            discountTier: 0,
            approvalRequired: true,
            primaryContactEmail: input.contactEmail,
            primaryContactPhone: input.contactPhone,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.companyAccounts.set(account.id, account);

        // Update customer custom fields
        await this.customerService.update(ctx, {
            id: input.customerId,
            customFields: {
                isB2b: true,
                companyName: input.name
            }
        });

        return account;
    }

    async approveCompanyAccount(ctx: RequestContext, accountId: ID): Promise<CompanyAccount> {
        const account = this.companyAccounts.get(accountId);
        if (!account) {
            throw new Error('Company account not found');
        }

        account.status = 'approved';
        account.updatedAt = new Date();
        
        return account;
    }

    async getCompanyAccount(ctx: RequestContext, customerId: ID): Promise<CompanyAccount | null> {
        // In production, this would query from database
        const customer = await this.customerService.findOne(ctx, customerId);
        if (!customer?.customFields?.isB2b) {
            return null;
        }

        // Find company account by customer
        return Array.from(this.companyAccounts.values())
            .find(acc => acc.primaryContactEmail === customer.emailAddress) || null;
    }

    async calculateBulkPrice(
        ctx: RequestContext,
        productVariantId: ID,
        quantity: number,
        customerId?: ID
    ): Promise<{
        unitPrice: number;
        totalPrice: number;
        discountPercent: number;
        discountAmount: number;
    }> {
        const variant = await this.productVariantService.findOne(ctx, productVariantId);
        if (!variant) {
            throw new Error('Product variant not found');
        }

        let basePrice = variant.price;
        let discountPercent = 0;

        // Check for bulk pricing rules
        const bulkPrices = this.bulkPricing.get(productVariantId) || [];
        const applicablePrice = bulkPrices.find(
            bp => quantity >= bp.minQuantity && 
                  (bp.maxQuantity === null || quantity <= bp.maxQuantity)
        );

        if (applicablePrice) {
            basePrice = applicablePrice.pricePerUnit;
            discountPercent = applicablePrice.discountPercent;
        } else {
            // Default bulk discount tiers
            if (quantity >= 1000) {
                discountPercent = 25;
            } else if (quantity >= 500) {
                discountPercent = 20;
            } else if (quantity >= 100) {
                discountPercent = 15;
            } else if (quantity >= 50) {
                discountPercent = 10;
            } else if (quantity >= 25) {
                discountPercent = 5;
            }
        }

        // Apply additional B2B customer discount
        if (customerId) {
            const companyAccount = await this.getCompanyAccount(ctx, customerId);
            if (companyAccount && companyAccount.status === 'approved') {
                // Add tier-based discount
                discountPercent += companyAccount.discountTier * 2; // 2% per tier
            }
        }

        const unitPrice = basePrice * (1 - discountPercent / 100);
        const totalPrice = unitPrice * quantity;
        const discountAmount = (basePrice * quantity) - totalPrice;

        return {
            unitPrice,
            totalPrice,
            discountPercent,
            discountAmount
        };
    }

    async createQuoteRequest(
        ctx: RequestContext,
        input: {
            customerId: ID;
            items: Array<{
                productVariantId: ID;
                quantity: number;
            }>;
            notes?: string;
        }
    ): Promise<QuoteRequest> {
        const companyAccount = await this.getCompanyAccount(ctx, input.customerId);
        if (!companyAccount) {
            throw new Error('Company account required for quote requests');
        }

        if (companyAccount.status !== 'approved') {
            throw new Error('Company account must be approved to request quotes');
        }

        // Calculate quote items
        const quoteItems: QuoteItem[] = [];
        let totalAmount = 0;

        for (const item of input.items) {
            const pricing = await this.calculateBulkPrice(
                ctx, 
                item.productVariantId, 
                item.quantity, 
                input.customerId
            );

            quoteItems.push({
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                unitPrice: pricing.unitPrice,
                totalPrice: pricing.totalPrice
            });

            totalAmount += pricing.totalPrice;
        }

        const quote: QuoteRequest = {
            id: Math.random().toString(36).substr(2, 9),
            companyAccountId: companyAccount.id,
            items: quoteItems,
            status: 'pending',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            totalAmount,
            notes: input.notes || '',
            createdAt: new Date()
        };

        this.quoteRequests.set(quote.id, quote);

        return quote;
    }

    async getQuoteRequests(ctx: RequestContext, customerId: ID): Promise<QuoteRequest[]> {
        const companyAccount = await this.getCompanyAccount(ctx, customerId);
        if (!companyAccount) {
            return [];
        }

        return Array.from(this.quoteRequests.values())
            .filter(quote => quote.companyAccountId === companyAccount.id);
    }

    async updateCompanyCredit(ctx: RequestContext, order: Order): Promise<void> {
        const customer = await this.customerService.findOne(ctx, order.customerId as ID);
        if (!customer?.customFields?.isB2b) {
            return;
        }

        const companyAccount = await this.getCompanyAccount(ctx, customer.id);
        if (!companyAccount || companyAccount.status !== 'approved') {
            return;
        }

        // Update current credit usage
        companyAccount.currentCredit += order.totalWithTax;
        
        // Check credit limit
        if (companyAccount.currentCredit > companyAccount.creditLimit) {
            console.warn(`Company ${companyAccount.name} exceeded credit limit`);
            // In production, you might want to trigger alerts or block future orders
        }

        companyAccount.updatedAt = new Date();
    }

    async setBulkPricing(
        ctx: RequestContext,
        productVariantId: ID,
        pricing: BulkPricing[]
    ): Promise<void> {
        // Validate pricing tiers don't overlap
        const sortedPricing = pricing.sort((a, b) => a.minQuantity - b.minQuantity);
        
        for (let i = 0; i < sortedPricing.length - 1; i++) {
            const current = sortedPricing[i];
            const next = sortedPricing[i + 1];
            
            if (current.maxQuantity && current.maxQuantity >= next.minQuantity) {
                throw new Error('Bulk pricing tiers cannot overlap');
            }
        }

        this.bulkPricing.set(productVariantId, sortedPricing);
    }

    private validateTaxId(taxId: string): boolean {
        // Simple validation - enhance based on your country's requirements
        // This accepts alphanumeric tax IDs between 8-15 characters
        const taxIdRegex = /^[A-Z0-9]{8,15}$/;
        return taxIdRegex.test(taxId.toUpperCase());
    }
}

// GraphQL Resolver for B2B operations
@Resolver()
export class B2BResolver {
    constructor(private b2bService: B2BService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async myCompanyAccount(@Ctx() ctx: RequestContext): Promise<CompanyAccount | null> {
        const customerId = ctx.activeUserId;
        if (!customerId) {
            return null;
        }
        return this.b2bService.getCompanyAccount(ctx, customerId);
    }

    @Query()
    @Allow(Permission.Authenticated)
    async calculateBulkPrice(
        @Ctx() ctx: RequestContext,
        @Args() args: { productVariantId: ID; quantity: number }
    ) {
        const customerId = ctx.activeUserId;
        return this.b2bService.calculateBulkPrice(
            ctx,
            args.productVariantId,
            args.quantity,
            customerId
        );
    }

    @Query()
    @Allow(Permission.Authenticated)
    async myQuoteRequests(@Ctx() ctx: RequestContext): Promise<QuoteRequest[]> {
        const customerId = ctx.activeUserId;
        if (!customerId) {
            return [];
        }
        return this.b2bService.getQuoteRequests(ctx, customerId);
    }

    @Mutation()
    @Allow(Permission.Authenticated)
    async createCompanyAccount(
        @Ctx() ctx: RequestContext,
        @Args() args: {
            input: {
                name: string;
                taxId: string;
                contactEmail: string;
                contactPhone: string;
            }
        }
    ): Promise<CompanyAccount> {
        const customerId = ctx.activeUserId;
        if (!customerId) {
            throw new Error('Must be logged in to create company account');
        }

        return this.b2bService.createCompanyAccount(ctx, {
            customerId,
            ...args.input
        });
    }

    @Mutation()
    @Allow(Permission.Authenticated)
    async requestQuote(
        @Ctx() ctx: RequestContext,
        @Args() args: {
            input: {
                items: Array<{
                    productVariantId: ID;
                    quantity: number;
                }>;
                notes?: string;
            }
        }
    ): Promise<QuoteRequest> {
        const customerId = ctx.activeUserId;
        if (!customerId) {
            throw new Error('Must be logged in to request quote');
        }

        return this.b2bService.createQuoteRequest(ctx, {
            customerId,
            ...args.input
        });
    }
}

// Main B2B Plugin
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [B2BService],
    shopApiExtensions: {
        schema: gql`
            type CompanyAccount {
                id: ID!
                name: String!
                taxId: String!
                creditLimit: Float!
                currentCredit: Float!
                paymentTerms: String!
                discountTier: Int!
                approvalRequired: Boolean!
                status: String!
                createdAt: DateTime!
            }

            type BulkPriceResult {
                unitPrice: Float!
                totalPrice: Float!
                discountPercent: Float!
                discountAmount: Float!
            }

            type QuoteRequest {
                id: ID!
                items: [QuoteItem!]!
                status: String!
                validUntil: DateTime!
                totalAmount: Float!
                notes: String
                createdAt: DateTime!
            }

            type QuoteItem {
                productVariantId: ID!
                quantity: Int!
                unitPrice: Float!
                totalPrice: Float!
            }

            extend type Query {
                myCompanyAccount: CompanyAccount
                calculateBulkPrice(productVariantId: ID!, quantity: Int!): BulkPriceResult!
                myQuoteRequests: [QuoteRequest!]!
            }

            input CreateCompanyAccountInput {
                name: String!
                taxId: String!
                contactEmail: String!
                contactPhone: String!
            }

            input RequestQuoteInput {
                items: [QuoteItemInput!]!
                notes: String
            }

            input QuoteItemInput {
                productVariantId: ID!
                quantity: Int!
            }

            extend type Mutation {
                createCompanyAccount(input: CreateCompanyAccountInput!): CompanyAccount!
                requestQuote(input: RequestQuoteInput!): QuoteRequest!
            }
        `,
        resolvers: [B2BResolver]
    },
    configuration: config => {
        // Add B2B-specific configuration
        console.log('B2B Plugin configuration loaded');
        return config;
    },
})
export class B2BPlugin {}
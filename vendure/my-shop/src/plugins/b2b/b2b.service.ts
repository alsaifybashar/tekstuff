import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection, CustomerService, ID } from '@vendure/core';
import { CompanyAccount } from './entities/company-account.entity';
import { BulkOrder } from './entities/bulk-order.entity';

@Injectable()
export class B2BService {
    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
    ) {}

    async createCompanyAccount(
        ctx: RequestContext,
        input: {
            name: string;
            taxId: string;
            contactEmail: string;
            contactPhone: string;
        }
    ): Promise<CompanyAccount> {
        // Validate tax ID format
        if (!this.validateTaxId(input.taxId)) {
            throw new Error('Invalid tax ID format');
        }

        // Check if company already exists
        const existing = await this.connection
            .getRepository(ctx, CompanyAccount)
            .findOne({
                where: { taxId: input.taxId },
            });

        if (existing) {
            throw new Error('Company account already exists');
        }

        const account = new CompanyAccount();
        account.name = input.name;
        account.taxId = input.taxId;
        account.contactEmail = input.contactEmail;
        account.contactPhone = input.contactPhone;
        account.status = 'pending_verification';
        account.creditLimit = 0; // Will be set after verification
        account.paymentTerms = 'NET30';

        return this.connection
            .getRepository(ctx, CompanyAccount)
            .save(account);
    }

    async calculateBulkDiscount(quantity: number, basePrice: number): Promise<{
        discount: number;
        finalPrice: number;
    }> {
        let discount = 0;
        
        if (quantity >= 1000) {
            discount = 0.25;
        } else if (quantity >= 500) {
            discount = 0.20;
        } else if (quantity >= 100) {
            discount = 0.15;
        } else if (quantity >= 50) {
            discount = 0.10;
        } else if (quantity >= 10) {
            discount = 0.05;
        }

        const finalPrice = basePrice * quantity * (1 - discount);
        
        return {
            discount: discount * 100,
            finalPrice,
        };
    }

    private validateTaxId(taxId: string): boolean {
        // Implement tax ID validation logic based on your country
        // This is a simple example
        return /^[A-Z0-9]{8,12}$/.test(taxId);
    }
}
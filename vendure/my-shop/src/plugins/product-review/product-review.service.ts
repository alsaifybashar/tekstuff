import { Injectable } from '@nestjs/common';
import {
    RequestContext,
    TransactionalConnection,
    ID,
    CustomerService,
    OrderService,
} from '@vendure/core';
import { ProductReview } from './product-review.entity';

@Injectable()
export class ProductReviewService {
    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private orderService: OrderService,
    ) {}

    async create(
        ctx: RequestContext,
        productId: ID,
        rating: number,
        title: string,
        content: string,
    ): Promise<ProductReview> {
        const customer = ctx.activeUserId
            ? await this.customerService.findOneByUserId(ctx, ctx.activeUserId)
            : null;

        const review = new ProductReview({
            productId,
            customerId: customer?.id,
            customerName: customer
                ? `${customer.firstName} ${customer.lastName}`
                : 'Anonymous',
            rating,
            title,
            content,
            verified: customer ? await this.hasCustomerPurchased(ctx, customer.id, productId) : false,
            approved: false, // Requires admin approval
        });

        return this.connection.getRepository(ctx, ProductReview).save(review);
    }

    async findByProductId(ctx: RequestContext, productId: ID): Promise<ProductReview[]> {
        return this.connection.getRepository(ctx, ProductReview).find({
            where: { productId, approved: true },
            order: { createdAt: 'DESC' },
        });
    }

    async getAverageRating(ctx: RequestContext, productId: ID): Promise<number> {
        const result = await this.connection
            .getRepository(ctx, ProductReview)
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .where('review.productId = :productId', { productId })
            .andWhere('review.approved = :approved', { approved: true })
            .getRawOne();

        return result?.avg ? parseFloat(result.avg) : 0;
    }

    private async hasCustomerPurchased(
        ctx: RequestContext,
        customerId: ID,
        productId: ID,
    ): Promise<boolean> {
        // Check if customer has purchased this product
        // This is simplified - implement proper order line item check
        return true;
    }
}
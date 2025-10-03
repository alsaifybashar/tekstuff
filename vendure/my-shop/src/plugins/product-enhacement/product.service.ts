import { Injectable, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { 
    RequestContext, 
    TransactionalConnection, 
    ProductService as VendureProductService,
    ID,
    Product
} from '@vendure/core';
import { ProductReview } from './entities/product-review.entity';
import { ProductSpecification } from './entities/product-specification.entity';

@Injectable()
export class ProductService {
    constructor(
        private connection: TransactionalConnection,
        private productService: VendureProductService,
    ) {}

    async getProductWithEnhancements(
        ctx: RequestContext, 
        productId: ID
    ): Promise<Product & { reviews: ProductReview[], specifications: ProductSpecification[] }> {
        const product = await this.productService.findOne(ctx, productId);
        
        if (!product) {
            throw new Error('Product not found');
        }

        const reviews = await this.connection
            .getRepository(ctx, ProductReview)
            .find({
                where: { product: { id: productId } },
                order: { createdAt: 'DESC' },
            });

        const specifications = await this.connection
            .getRepository(ctx, ProductSpecification)
            .find({
                where: { product: { id: productId } },
                order: { group: 'ASC', name: 'ASC' },
            });

        return {
            ...product,
            reviews,
            specifications,
        };
    }

    async createReview(
        ctx: RequestContext,
        input: {
            productId: ID;
            rating: number;
            comment?: string;
            author: string;
        }
    ): Promise<ProductReview> {
        // Validate rating
        if (input.rating < 1 || input.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Check if user already reviewed this product
        const existingReview = await this.connection
            .getRepository(ctx, ProductReview)
            .findOne({
                where: {
                    product: { id: input.productId },
                    author: input.author,
                },
            });

        if (existingReview) {
            throw new Error('You have already reviewed this product');
        }

        const review = new ProductReview();
        review.product = { id: input.productId } as any;
        review.rating = input.rating;
        review.comment = input.comment || '';
        review.author = input.author;
        review.verified = false; // Will be verified after purchase confirmation

        return this.connection
            .getRepository(ctx, ProductReview)
            .save(review);
    }

    async getRelatedProducts(
        ctx: RequestContext,
        productId: ID,
        limit: number = 4
    ): Promise<Product[]> {
        const product = await this.productService.findOne(ctx, productId, ['facetValues']);
        
        if (!product) {
            return [];
        }

        // Get products from the same category
        const relatedProducts = await this.productService.findAll(ctx, {
            take: limit + 1, // Get one extra to exclude current product
            filter: {
                facetValueId: {
                    in: product.facetValues.map(fv => fv.id),
                },
            },
        });

        return relatedProducts.items
            .filter(p => p.id !== productId)
            .slice(0, limit);
    }
}
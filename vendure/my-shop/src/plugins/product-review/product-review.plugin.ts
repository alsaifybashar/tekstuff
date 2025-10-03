import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { ProductReview } from './product-review.entity';
import { ProductReviewService } from './product-review.service';
import { ProductReviewResolver } from './product-review.resolver';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ProductReview],
    providers: [ProductReviewService],
    shopApiExtensions: {
        resolvers: [ProductReviewResolver],
        schema: `
            type ProductReview {
                id: ID!
                createdAt: DateTime!
                updatedAt: DateTime!
                productId: ID!
                customerId: ID
                customerName: String!
                rating: Int!
                title: String!
                content: String!
                verified: Boolean!
                approved: Boolean!
            }

            extend type Product {
                reviews: [ProductReview!]!
                averageRating: Float
                reviewCount: Int!
            }

            extend type Mutation {
                submitProductReview(input: SubmitReviewInput!): ProductReview!
            }

            input SubmitReviewInput {
                productId: ID!
                rating: Int!
                title: String!
                content: String!
            }
        `,
    },
})
export class ProductReviewPlugin {}
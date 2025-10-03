import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { StockAllocationStrategy } from './stock-allocation-strategy';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [InventoryMovement],
    providers: [
        InventoryService,
        StockAllocationStrategy,
    ],
    shopApiExtensions: {
        resolvers: [InventoryResolver],
        schema: `
            type InventoryMovement {
                id: ID!
                type: String!
                quantity: Int!
                productVariantId: ID!
                orderId: ID
                notes: String
                createdAt: DateTime!
            }
            
            type StockLevel {
                productVariantId: ID!
                stockOnHand: Int!
                stockAllocated: Int!
                stockAvailable: Int!
                lowStockThreshold: Int!
                isLowStock: Boolean!
                isOutOfStock: Boolean!
            }

            extend type Query {
                stockLevel(productVariantId: ID!): StockLevel
                stockLevels(productVariantIds: [ID!]!): [StockLevel!]!
            }
        `,
    },
    configuration: config => {
        // Override stock allocation strategy
        config.catalogOptions.stockAllocationStrategy = StockAllocationStrategy;
        return config;
    },
})
export class InventoryPlugin {}
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity, ID } from '@vendure/core';
import { Column, Entity, Index } from 'typeorm';

export enum MovementType {
    ADJUSTMENT = 'ADJUSTMENT',
    SALE = 'SALE',
    RETURN = 'RETURN',
    CANCELLATION = 'CANCELLATION',
    RESTOCK = 'RESTOCK',
}

@Entity()
@Index(['productVariantId', 'createdAt'])
export class InventoryMovement extends VendureEntity {
    constructor(input?: DeepPartial<InventoryMovement>) {
        super(input);
    }

    @Column({ type: 'enum', enum: MovementType })
    type: MovementType;

    @Column()
    quantity: number;

    @Column()
    productVariantId: ID;

    @Column({ nullable: true })
    orderId: ID;

    @Column('text', { nullable: true })
    notes: string;

    @Column()
    userId: ID;
}
import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity, ID } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class ProductReview extends VendureEntity {
    constructor(input?: DeepPartial<ProductReview>) {
        super(input);
    }

    @Column()
    productId: ID;

    @Column({ nullable: true })
    customerId: ID;

    @Column()
    customerName: string;

    @Column()
    rating: number;

    @Column()
    title: string;

    @Column('text')
    content: string;

    @Column({ default: false })
    verified: boolean;

    @Column({ default: false })
    approved: boolean;
}
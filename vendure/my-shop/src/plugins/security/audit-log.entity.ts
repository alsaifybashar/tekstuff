import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity, ID } from '@vendure/core';
import { Column, Entity, Index } from 'typeorm';

@Entity()
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog extends VendureEntity {
    constructor(input?: DeepPartial<AuditLog>) {
        super(input);
    }

    @Column()
    userId: ID;

    @Column()
    action: string;

    @Column('json', { nullable: true })
    metadata: any;

    @Column()
    ipAddress: string;

    @Column()
    userAgent: string;

    @Column({ default: false })
    suspicious: boolean;

    @Column('text', { nullable: true })
    notes: string;
}
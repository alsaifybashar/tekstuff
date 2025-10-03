import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddSecurityTables1704000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'audit_log',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'ipAddress',
                        type: 'varchar',
                        length: '45',
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                    },
                    {
                        name: 'suspicious',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'audit_log',
            new Index({
                name: 'IDX_AUDIT_LOG_USER_DATE',
                columnNames: ['userId', 'createdAt'],
            }),
        );

        await queryRunner.createIndex(
            'audit_log',
            new Index({
                name: 'IDX_AUDIT_LOG_ACTION_DATE',
                columnNames: ['action', 'createdAt'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('audit_log', 'IDX_AUDIT_LOG_ACTION_DATE');
        await queryRunner.dropIndex('audit_log', 'IDX_AUDIT_LOG_USER_DATE');
        await queryRunner.dropTable('audit_log');
    }
}
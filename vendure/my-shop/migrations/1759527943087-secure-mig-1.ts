import {MigrationInterface, QueryRunner} from "typeorm";

export class SecureMig11759527943087 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_91a19e6613534949a4ce6e76ff"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_product" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "enabled" boolean NOT NULL DEFAULT (1), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "featuredAssetId" integer, "customFieldsTechnicalspecs" text, "customFieldsWarrantyinfo" varchar(255), "customFieldsManufacturer" varchar(255), CONSTRAINT "FK_91a19e6613534949a4ce6e76ff8" FOREIGN KEY ("featuredAssetId") REFERENCES "asset" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_product"("createdAt", "updatedAt", "deletedAt", "enabled", "id", "featuredAssetId") SELECT "createdAt", "updatedAt", "deletedAt", "enabled", "id", "featuredAssetId" FROM "product"`, undefined);
        await queryRunner.query(`DROP TABLE "product"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_product" RENAME TO "product"`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_91a19e6613534949a4ce6e76ff" ON "product" ("featuredAssetId") `, undefined);
        await queryRunner.query(`DROP INDEX "IDX_6e420052844edf3a5506d863ce"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e38dca0d82fd64c7cf8aac8b8e"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_0e6f516053cf982b537836e21c"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_product_variant" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "enabled" boolean NOT NULL DEFAULT (1), "sku" varchar NOT NULL, "outOfStockThreshold" integer NOT NULL DEFAULT (0), "useGlobalOutOfStockThreshold" boolean NOT NULL DEFAULT (1), "trackInventory" varchar NOT NULL DEFAULT ('INHERIT'), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "featuredAssetId" integer, "taxCategoryId" integer, "productId" integer, "customFieldsColor" varchar(255), "customFieldsVoltage" varchar(255), CONSTRAINT "FK_6e420052844edf3a5506d863ce6" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_e38dca0d82fd64c7cf8aac8b8ef" FOREIGN KEY ("taxCategoryId") REFERENCES "tax_category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0e6f516053cf982b537836e21cf" FOREIGN KEY ("featuredAssetId") REFERENCES "asset" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_product_variant"("createdAt", "updatedAt", "deletedAt", "enabled", "sku", "outOfStockThreshold", "useGlobalOutOfStockThreshold", "trackInventory", "id", "featuredAssetId", "taxCategoryId", "productId") SELECT "createdAt", "updatedAt", "deletedAt", "enabled", "sku", "outOfStockThreshold", "useGlobalOutOfStockThreshold", "trackInventory", "id", "featuredAssetId", "taxCategoryId", "productId" FROM "product_variant"`, undefined);
        await queryRunner.query(`DROP TABLE "product_variant"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_product_variant" RENAME TO "product_variant"`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6e420052844edf3a5506d863ce" ON "product_variant" ("productId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e38dca0d82fd64c7cf8aac8b8e" ON "product_variant" ("taxCategoryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0e6f516053cf982b537836e21c" ON "product_variant" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_customer" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "title" varchar, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "phoneNumber" varchar, "emailAddress" varchar NOT NULL, "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer, "customFieldsIsb2b" boolean DEFAULT (0), "customFieldsCompanyname" varchar(255), CONSTRAINT "REL_3f62b42ed23958b120c235f74d" UNIQUE ("userId"), CONSTRAINT "FK_3f62b42ed23958b120c235f74df" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_customer"("createdAt", "updatedAt", "deletedAt", "title", "firstName", "lastName", "phoneNumber", "emailAddress", "id", "userId") SELECT "createdAt", "updatedAt", "deletedAt", "title", "firstName", "lastName", "phoneNumber", "emailAddress", "id", "userId" FROM "customer"`, undefined);
        await queryRunner.query(`DROP TABLE "customer"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_customer" RENAME TO "customer"`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "customer" RENAME TO "temporary_customer"`, undefined);
        await queryRunner.query(`CREATE TABLE "customer" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "title" varchar, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "phoneNumber" varchar, "emailAddress" varchar NOT NULL, "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer, CONSTRAINT "REL_3f62b42ed23958b120c235f74d" UNIQUE ("userId"), CONSTRAINT "FK_3f62b42ed23958b120c235f74df" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "customer"("createdAt", "updatedAt", "deletedAt", "title", "firstName", "lastName", "phoneNumber", "emailAddress", "id", "userId") SELECT "createdAt", "updatedAt", "deletedAt", "title", "firstName", "lastName", "phoneNumber", "emailAddress", "id", "userId" FROM "temporary_customer"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_customer"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_0e6f516053cf982b537836e21c"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e38dca0d82fd64c7cf8aac8b8e"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_6e420052844edf3a5506d863ce"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" RENAME TO "temporary_product_variant"`, undefined);
        await queryRunner.query(`CREATE TABLE "product_variant" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "enabled" boolean NOT NULL DEFAULT (1), "sku" varchar NOT NULL, "outOfStockThreshold" integer NOT NULL DEFAULT (0), "useGlobalOutOfStockThreshold" boolean NOT NULL DEFAULT (1), "trackInventory" varchar NOT NULL DEFAULT ('INHERIT'), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "featuredAssetId" integer, "taxCategoryId" integer, "productId" integer, CONSTRAINT "FK_6e420052844edf3a5506d863ce6" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_e38dca0d82fd64c7cf8aac8b8ef" FOREIGN KEY ("taxCategoryId") REFERENCES "tax_category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0e6f516053cf982b537836e21cf" FOREIGN KEY ("featuredAssetId") REFERENCES "asset" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "product_variant"("createdAt", "updatedAt", "deletedAt", "enabled", "sku", "outOfStockThreshold", "useGlobalOutOfStockThreshold", "trackInventory", "id", "featuredAssetId", "taxCategoryId", "productId") SELECT "createdAt", "updatedAt", "deletedAt", "enabled", "sku", "outOfStockThreshold", "useGlobalOutOfStockThreshold", "trackInventory", "id", "featuredAssetId", "taxCategoryId", "productId" FROM "temporary_product_variant"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_product_variant"`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0e6f516053cf982b537836e21c" ON "product_variant" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e38dca0d82fd64c7cf8aac8b8e" ON "product_variant" ("taxCategoryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6e420052844edf3a5506d863ce" ON "product_variant" ("productId") `, undefined);
        await queryRunner.query(`DROP INDEX "IDX_91a19e6613534949a4ce6e76ff"`, undefined);
        await queryRunner.query(`ALTER TABLE "product" RENAME TO "temporary_product"`, undefined);
        await queryRunner.query(`CREATE TABLE "product" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, "enabled" boolean NOT NULL DEFAULT (1), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "featuredAssetId" integer, CONSTRAINT "FK_91a19e6613534949a4ce6e76ff8" FOREIGN KEY ("featuredAssetId") REFERENCES "asset" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "product"("createdAt", "updatedAt", "deletedAt", "enabled", "id", "featuredAssetId") SELECT "createdAt", "updatedAt", "deletedAt", "enabled", "id", "featuredAssetId" FROM "temporary_product"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_product"`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_91a19e6613534949a4ce6e76ff" ON "product" ("featuredAssetId") `, undefined);
   }

}

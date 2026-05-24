CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'HIDDEN', 'OUT_OF_STOCK');

ALTER TABLE "Product"
ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "Product"
SET "status" =
  CASE
    WHEN "isActive" = false THEN 'HIDDEN'::"ProductStatus"
    WHEN COALESCE("stock", 0) <= 0 THEN 'OUT_OF_STOCK'::"ProductStatus"
    ELSE 'ACTIVE'::"ProductStatus"
  END;

-- Scale public catalog/search reads without creating a duplicate product database.
-- pg_trgm accelerates case-insensitive contains search used by /api/search and /api/products?q=...
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_public_name_trgm_idx"
ON "Product" USING GIN ("name" gin_trgm_ops)
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_description_trgm_idx"
ON "Product" USING GIN ("description" gin_trgm_ops)
WHERE "status" = 'ACTIVE' AND "isActive" = true AND "description" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Product_public_category_trgm_idx"
ON "Product" USING GIN ("category" gin_trgm_ops)
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_tags_gin_idx"
ON "Product" USING GIN ("tags")
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_sizes_gin_idx"
ON "Product" USING GIN ("sizes")
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_colors_gin_idx"
ON "Product" USING GIN ("colors")
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_price_idx"
ON "Product" ("price")
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_vendor_total_sold_idx"
ON "Product" ("vendorId", "totalSold" DESC, "createdAt" DESC)
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Product_public_vendor_created_at_idx"
ON "Product" ("vendorId", "createdAt" DESC)
WHERE "status" = 'ACTIVE' AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "Vendor_public_shop_name_trgm_idx"
ON "Vendor" USING GIN ("shopName" gin_trgm_ops)
WHERE "isApproved" = true AND "isSuspended" = false AND "isPartnered" = true;

CREATE INDEX IF NOT EXISTS "Vendor_public_category_trgm_idx"
ON "Vendor" USING GIN ("category" gin_trgm_ops)
WHERE "isApproved" = true AND "isSuspended" = false AND "isPartnered" = true AND "category" IS NOT NULL;

-- Admin scale indexes for large customer/vendor/product/order/support datasets.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Prisma schema-backed btree indexes.
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");
CREATE INDEX IF NOT EXISTS "User_role_isBanned_idx" ON "User"("role", "isBanned");
CREATE INDEX IF NOT EXISTS "Vendor_createdAt_idx" ON "Vendor"("createdAt");
CREATE INDEX IF NOT EXISTS "Vendor_shopName_idx" ON "Vendor"("shopName");
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- Trigram indexes for admin contains/partial searches.
CREATE INDEX IF NOT EXISTS "User_name_trgm_idx" ON "User" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING GIN (lower("email") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_phone_trgm_idx" ON "User" USING GIN (lower("phone") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Vendor_shopName_trgm_idx" ON "Vendor" USING GIN (lower("shopName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vendor_slug_trgm_idx" ON "Vendor" USING GIN (lower("slug") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vendor_phone_trgm_idx" ON "Vendor" USING GIN (lower("phone") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vendor_panNumber_trgm_idx" ON "Vendor" USING GIN (lower("panNumber") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vendor_district_trgm_idx" ON "Vendor" USING GIN (lower("district") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_slug_trgm_idx" ON "Product" USING GIN (lower("slug") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_category_trgm_idx" ON "Product" USING GIN (lower("category") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Order_orderNumber_trgm_idx" ON "Order" USING GIN (lower("orderNumber") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Order_paymentMethod_trgm_idx" ON "Order" USING GIN (lower("paymentMethod") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_trgm_idx" ON "Order" USING GIN (lower("paymentStatus") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupportTicket_name_trgm_idx" ON "SupportTicket" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SupportTicket_email_trgm_idx" ON "SupportTicket" USING GIN (lower("email") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SupportTicket_topic_trgm_idx" ON "SupportTicket" USING GIN (lower("topic") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SupportTicket_orderNumber_trgm_idx" ON "SupportTicket" USING GIN (lower("orderNumber") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SupportTicket_message_trgm_idx" ON "SupportTicket" USING GIN (lower("message") gin_trgm_ops);

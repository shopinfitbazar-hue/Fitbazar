CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Vendor_isApproved_isSuspended_isPartnered_idx" ON "Vendor"("isApproved", "isSuspended", "isPartnered");
CREATE INDEX IF NOT EXISTS "Vendor_isTopShop_createdAt_idx" ON "Vendor"("isTopShop", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_status_isActive_createdAt_idx" ON "Product"("status", "isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_status_category_idx" ON "Product"("status", "category");
CREATE INDEX IF NOT EXISTS "Product_status_discountPct_idx" ON "Product"("status", "discountPct");
CREATE INDEX IF NOT EXISTS "Product_status_totalSold_idx" ON "Product"("status", "totalSold");
CREATE INDEX IF NOT EXISTS "Product_vendorId_status_idx" ON "Product"("vendorId", "status");

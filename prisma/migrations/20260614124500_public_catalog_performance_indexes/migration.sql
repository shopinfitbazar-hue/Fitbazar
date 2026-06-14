CREATE INDEX "Vendor_isApproved_isSuspended_idx" ON "Vendor"("isApproved", "isSuspended");

CREATE INDEX "Product_status_isActive_totalSold_idx" ON "Product"("status", "isActive", "totalSold");
CREATE INDEX "Product_status_isActive_category_totalSold_idx" ON "Product"("status", "isActive", "category", "totalSold");
CREATE INDEX "Product_status_isActive_category_createdAt_idx" ON "Product"("status", "isActive", "category", "createdAt");
CREATE INDEX "Product_status_isActive_discountPct_totalSold_idx" ON "Product"("status", "isActive", "discountPct", "totalSold");
CREATE INDEX "Product_status_isActive_homepageSlot_homepagePriority_idx" ON "Product"("status", "isActive", "homepageSlot", "homepagePriority");

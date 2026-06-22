CREATE INDEX IF NOT EXISTS "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_vendorId_createdAt_idx" ON "Order"("vendorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_vendorId_status_createdAt_idx" ON "Order"("vendorId", "status", "createdAt");

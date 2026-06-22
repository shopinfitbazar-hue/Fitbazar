-- Delivery partner app foundation.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DELIVERY';

CREATE TYPE "DeliveryAssignmentStatus" AS ENUM (
    'ASSIGNED',
    'PICKUP_CONFIRMED',
    'IN_TRANSIT',
    'DELIVERED',
    'FAILED',
    'CANCELLED'
);

CREATE TYPE "DeliveryEarningStatus" AS ENUM (
    'PENDING',
    'RELEASED',
    'CANCELLED'
);

CREATE TABLE "DeliveryPartner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'FITBAZAR',
    "vehicleType" TEXT,
    "vehicleNumber" TEXT,
    "currentZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryPartner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryAssignment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partnerId" TEXT,
    "status" "DeliveryAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "pickupCode" TEXT,
    "deliveryCode" TEXT,
    "pickupAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "proofImageUrl" TEXT,
    "customerContact" TEXT,
    "routeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryStatusEvent" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "status" "DeliveryAssignmentStatus" NOT NULL,
    "note" TEXT,
    "location" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryEarning" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "DeliveryEarningStatus" NOT NULL DEFAULT 'PENDING',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryEarning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryPartner_userId_key" ON "DeliveryPartner"("userId");
CREATE INDEX "DeliveryPartner_isActive_isSuspended_idx" ON "DeliveryPartner"("isActive", "isSuspended");
CREATE INDEX "DeliveryPartner_provider_isActive_idx" ON "DeliveryPartner"("provider", "isActive");
CREATE INDEX "DeliveryPartner_currentZone_idx" ON "DeliveryPartner"("currentZone");

CREATE UNIQUE INDEX "DeliveryAssignment_orderId_key" ON "DeliveryAssignment"("orderId");
CREATE INDEX "DeliveryAssignment_partnerId_status_createdAt_idx" ON "DeliveryAssignment"("partnerId", "status", "createdAt");
CREATE INDEX "DeliveryAssignment_status_createdAt_idx" ON "DeliveryAssignment"("status", "createdAt");
CREATE INDEX "DeliveryAssignment_createdAt_idx" ON "DeliveryAssignment"("createdAt");

CREATE INDEX "DeliveryStatusEvent_assignmentId_createdAt_idx" ON "DeliveryStatusEvent"("assignmentId", "createdAt");
CREATE INDEX "DeliveryStatusEvent_actorUserId_createdAt_idx" ON "DeliveryStatusEvent"("actorUserId", "createdAt");
CREATE INDEX "DeliveryStatusEvent_status_createdAt_idx" ON "DeliveryStatusEvent"("status", "createdAt");

CREATE UNIQUE INDEX "DeliveryEarning_assignmentId_key" ON "DeliveryEarning"("assignmentId");
CREATE INDEX "DeliveryEarning_partnerId_status_createdAt_idx" ON "DeliveryEarning"("partnerId", "status", "createdAt");

ALTER TABLE "DeliveryPartner" ADD CONSTRAINT "DeliveryPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "DeliveryPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryStatusEvent" ADD CONSTRAINT "DeliveryStatusEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DeliveryAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryStatusEvent" ADD CONSTRAINT "DeliveryStatusEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryEarning" ADD CONSTRAINT "DeliveryEarning_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DeliveryAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryEarning" ADD CONSTRAINT "DeliveryEarning_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "DeliveryPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

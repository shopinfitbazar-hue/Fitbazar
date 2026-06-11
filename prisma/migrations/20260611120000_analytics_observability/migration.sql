-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "eventType" TEXT NOT NULL,
    "path" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "deviceType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "path" TEXT,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ms',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_channel_createdAt_idx" ON "AnalyticsEvent"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_anonymousId_createdAt_idx" ON "AnalyticsEvent"("anonymousId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_channel_createdAt_idx" ON "PerformanceMetric"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricName_createdAt_idx" ON "PerformanceMetric"("metricName", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_userId_createdAt_idx" ON "PerformanceMetric"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

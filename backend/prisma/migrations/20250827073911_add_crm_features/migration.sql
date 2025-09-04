/*
  Warnings:

  - Added the required column `updatedAt` to the `CustomerInteraction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerInteraction" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CustomerSegmentationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegmentationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "averageValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "averageLifetimeValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegmentMembership" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomerSegmentMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentPricingRule" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "productId" TEXT,
    "discountPercentage" DECIMAL(5,2),
    "fixedPrice" DECIMAL(12,2),
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegmentPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEngagementScore" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "lastInteractionAt" TIMESTAMP(3),
    "quotationResponseRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "purchaseFrequency" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerEngagementScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpTask" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "interactionId" TEXT,
    "assignedToUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLimitHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "oldLimit" DECIMAL(12,2) NOT NULL,
    "newLimit" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLimitHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLifetimeValue" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "firstOrderDate" TIMESTAMP(3),
    "lastOrderDate" TIMESTAMP(3),
    "customerTenure" INTEGER NOT NULL DEFAULT 0,
    "predictedLifetimeValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLifetimeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegmentationRule_name_key" ON "CustomerSegmentationRule"("name");

-- CreateIndex
CREATE INDEX "CustomerSegmentationRule_name_idx" ON "CustomerSegmentationRule"("name");

-- CreateIndex
CREATE INDEX "CustomerSegmentationRule_isActive_idx" ON "CustomerSegmentationRule"("isActive");

-- CreateIndex
CREATE INDEX "CustomerSegmentationRule_priority_idx" ON "CustomerSegmentationRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegment_segmentId_key" ON "CustomerSegment"("segmentId");

-- CreateIndex
CREATE INDEX "CustomerSegment_segmentId_idx" ON "CustomerSegment"("segmentId");

-- CreateIndex
CREATE INDEX "CustomerSegment_name_idx" ON "CustomerSegment"("name");

-- CreateIndex
CREATE INDEX "CustomerSegment_isActive_idx" ON "CustomerSegment"("isActive");

-- CreateIndex
CREATE INDEX "CustomerSegmentMembership_customerId_idx" ON "CustomerSegmentMembership"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSegmentMembership_segmentId_idx" ON "CustomerSegmentMembership"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegmentMembership_customerId_segmentId_key" ON "CustomerSegmentMembership"("customerId", "segmentId");

-- CreateIndex
CREATE INDEX "SegmentPricingRule_segmentId_idx" ON "SegmentPricingRule"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentPricingRule_productId_idx" ON "SegmentPricingRule"("productId");

-- CreateIndex
CREATE INDEX "SegmentPricingRule_validFrom_validUntil_idx" ON "SegmentPricingRule"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "SegmentPricingRule_isActive_idx" ON "SegmentPricingRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerEngagementScore_customerId_key" ON "CustomerEngagementScore"("customerId");

-- CreateIndex
CREATE INDEX "CustomerEngagementScore_customerId_idx" ON "CustomerEngagementScore"("customerId");

-- CreateIndex
CREATE INDEX "CustomerEngagementScore_engagementScore_idx" ON "CustomerEngagementScore"("engagementScore");

-- CreateIndex
CREATE INDEX "CustomerEngagementScore_calculatedAt_idx" ON "CustomerEngagementScore"("calculatedAt");

-- CreateIndex
CREATE INDEX "FollowUpTask_customerId_idx" ON "FollowUpTask"("customerId");

-- CreateIndex
CREATE INDEX "FollowUpTask_assignedToUserId_idx" ON "FollowUpTask"("assignedToUserId");

-- CreateIndex
CREATE INDEX "FollowUpTask_dueDate_idx" ON "FollowUpTask"("dueDate");

-- CreateIndex
CREATE INDEX "FollowUpTask_status_idx" ON "FollowUpTask"("status");

-- CreateIndex
CREATE INDEX "FollowUpTask_priority_idx" ON "FollowUpTask"("priority");

-- CreateIndex
CREATE INDEX "CreditLimitHistory_customerId_idx" ON "CreditLimitHistory"("customerId");

-- CreateIndex
CREATE INDEX "CreditLimitHistory_createdAt_idx" ON "CreditLimitHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerLifetimeValue_customerId_key" ON "CustomerLifetimeValue"("customerId");

-- CreateIndex
CREATE INDEX "CustomerLifetimeValue_customerId_idx" ON "CustomerLifetimeValue"("customerId");

-- CreateIndex
CREATE INDEX "CustomerLifetimeValue_totalRevenue_idx" ON "CustomerLifetimeValue"("totalRevenue");

-- CreateIndex
CREATE INDEX "CustomerLifetimeValue_calculatedAt_idx" ON "CustomerLifetimeValue"("calculatedAt");

-- CreateIndex
CREATE INDEX "CustomerInteraction_status_idx" ON "CustomerInteraction"("status");

-- CreateIndex
CREATE INDEX "CustomerInteraction_priority_idx" ON "CustomerInteraction"("priority");

-- AddForeignKey
ALTER TABLE "CustomerSegmentMembership" ADD CONSTRAINT "CustomerSegmentMembership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSegmentMembership" ADD CONSTRAINT "CustomerSegmentMembership_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("segmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentPricingRule" ADD CONSTRAINT "SegmentPricingRule_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("segmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentPricingRule" ADD CONSTRAINT "SegmentPricingRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEngagementScore" ADD CONSTRAINT "CustomerEngagementScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "CustomerInteraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLimitHistory" ADD CONSTRAINT "CreditLimitHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLimitHistory" ADD CONSTRAINT "CreditLimitHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLifetimeValue" ADD CONSTRAINT "CustomerLifetimeValue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

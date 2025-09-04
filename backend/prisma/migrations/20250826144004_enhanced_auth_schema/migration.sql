/*
  Warnings:

  - The primary key for the `Customer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `company` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discountTotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `taxTotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Order` table. All the data in the column will be lost.
  - The primary key for the `OrderItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discount` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `OrderItem` table. All the data in the column will be lost.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `Quotation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discountTotal` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `taxTotal` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Quotation` table. All the data in the column will be lost.
  - The primary key for the `QuotationItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discount` on the `QuotationItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `QuotationItem` table. All the data in the column will be lost.
  - The primary key for the `RolePermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - The primary key for the `UserRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyName` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPerson` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `totalAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotal` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotal` to the `QuotationItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'SMALL_BUSINESS', 'ENTERPRISE', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('NET_15', 'NET_30', 'NET_45', 'NET_60', 'IMMEDIATE', 'ADVANCE');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_customerId_fkey";

-- DropForeignKey
ALTER TABLE "QuotationItem" DROP CONSTRAINT "QuotationItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "QuotationItem" DROP CONSTRAINT "QuotationItem_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable - Handle Customer data transformation
ALTER TABLE "Customer" 
ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'India',
ADD COLUMN     "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'SMALL_BUSINESS',
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30',
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "taxId" TEXT;

-- Migrate existing customer data
UPDATE "Customer" SET 
  "companyName" = COALESCE("company", "name", 'Unknown Company'),
  "contactPerson" = COALESCE("name", 'Unknown Contact'),
  "email" = COALESCE("email", CONCAT('customer', "id", '@example.com'));

-- Now make the columns NOT NULL
ALTER TABLE "Customer" 
ALTER COLUMN "companyName" SET NOT NULL,
ALTER COLUMN "contactPerson" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_pkey";
ALTER TABLE "Customer" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Customer" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("id");
ALTER TABLE "Customer" DROP COLUMN "company", DROP COLUMN "name";
DROP SEQUENCE "Customer_id_seq";

-- AlterTable - Handle File data transformation
ALTER TABLE "File" DROP CONSTRAINT "File_pkey";
ALTER TABLE "File" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "File" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "File" ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "File_id_seq";

-- AlterTable - Handle Order data transformation
ALTER TABLE "Order" 
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "expectedDelivery" TIMESTAMP(3),
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(12,2);

-- Migrate existing order data
UPDATE "Order" SET 
  "totalAmount" = "total",
  "discountAmount" = "discountTotal",
  "taxAmount" = "taxTotal";

-- Now make totalAmount NOT NULL
ALTER TABLE "Order" ALTER COLUMN "totalAmount" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey";
ALTER TABLE "Order" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Order" ALTER COLUMN "quotationId" SET DATA TYPE TEXT USING "quotationId"::TEXT;
ALTER TABLE "Order" ALTER COLUMN "customerId" SET DATA TYPE TEXT USING "customerId"::TEXT;
ALTER TABLE "Order" ALTER COLUMN "createdByUserId" SET DATA TYPE TEXT USING "createdByUserId"::TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");
ALTER TABLE "Order" DROP COLUMN "discountTotal", DROP COLUMN "taxTotal", DROP COLUMN "total";
DROP SEQUENCE "Order_id_seq";

-- AlterTable - Handle OrderItem data transformation
ALTER TABLE "OrderItem" 
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotal" DECIMAL(12,2);

-- Migrate existing order item data
UPDATE "OrderItem" SET 
  "lineTotal" = "total",
  "discountAmount" = "discount";

-- Now make lineTotal NOT NULL
ALTER TABLE "OrderItem" ALTER COLUMN "lineTotal" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_pkey";
ALTER TABLE "OrderItem" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "OrderItem" ALTER COLUMN "orderId" SET DATA TYPE TEXT USING "orderId"::TEXT;
ALTER TABLE "OrderItem" ALTER COLUMN "productId" SET DATA TYPE TEXT USING "productId"::TEXT;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id");
ALTER TABLE "OrderItem" DROP COLUMN "discount", DROP COLUMN "total";
DROP SEQUENCE "OrderItem_id_seq";

-- AlterTable - Handle Product data transformation
ALTER TABLE "Product" 
ADD COLUMN     "basePrice" DECIMAL(12,2),
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "inventoryCount" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minOrderQty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "specifications" JSONB;

-- Migrate existing product data
UPDATE "Product" SET "basePrice" = "price";

-- Now make basePrice NOT NULL
ALTER TABLE "Product" ALTER COLUMN "basePrice" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey";
ALTER TABLE "Product" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Product" ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");
ALTER TABLE "Product" DROP COLUMN "price";
DROP SEQUENCE "Product_id_seq";

-- AlterTable - Handle Quotation data transformation
ALTER TABLE "Quotation" 
ADD COLUMN     "customerRespondedAt" TIMESTAMP(3),
ADD COLUMN     "customerViewedAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "termsConditions" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(12,2);

-- Migrate existing quotation data
UPDATE "Quotation" SET 
  "totalAmount" = "total",
  "discountAmount" = "discountTotal",
  "taxAmount" = "taxTotal";

-- Now make totalAmount NOT NULL
ALTER TABLE "Quotation" ALTER COLUMN "totalAmount" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_pkey";
ALTER TABLE "Quotation" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Quotation" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Quotation" ALTER COLUMN "customerId" SET DATA TYPE TEXT USING "customerId"::TEXT;
ALTER TABLE "Quotation" ALTER COLUMN "createdByUserId" SET DATA TYPE TEXT USING "createdByUserId"::TEXT;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id");
ALTER TABLE "Quotation" DROP COLUMN "discountTotal", DROP COLUMN "taxTotal", DROP COLUMN "total";
DROP SEQUENCE "Quotation_id_seq";

-- AlterTable - Handle QuotationItem data transformation
ALTER TABLE "QuotationItem" 
ADD COLUMN     "customSpecifications" JSONB,
ADD COLUMN     "deliveryTimeline" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotal" DECIMAL(12,2);

-- Migrate existing quotation item data
UPDATE "QuotationItem" SET 
  "lineTotal" = "total",
  "discountAmount" = "discount";

-- Now make lineTotal NOT NULL
ALTER TABLE "QuotationItem" ALTER COLUMN "lineTotal" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "QuotationItem" DROP CONSTRAINT "QuotationItem_pkey";
ALTER TABLE "QuotationItem" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "QuotationItem" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "QuotationItem" ALTER COLUMN "quotationId" SET DATA TYPE TEXT USING "quotationId"::TEXT;
ALTER TABLE "QuotationItem" ALTER COLUMN "productId" SET DATA TYPE TEXT USING "productId"::TEXT;
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id");
ALTER TABLE "QuotationItem" DROP COLUMN "discount", DROP COLUMN "total";
DROP SEQUENCE "QuotationItem_id_seq";

-- AlterTable - Handle RolePermission data transformation
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_pkey";
ALTER TABLE "RolePermission" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "RolePermission" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "RolePermission_id_seq";

-- AlterTable - Handle User data transformation
ALTER TABLE "User" 
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- Migrate existing user data (copy password to passwordHash)
UPDATE "User" SET "passwordHash" = "password";

-- Now make passwordHash NOT NULL
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Change primary key and drop old columns
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
ALTER TABLE "User" DROP COLUMN "password";
DROP SEQUENCE "User_id_seq";

-- AlterTable - Handle UserRole data transformation
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_pkey";
ALTER TABLE "UserRole" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "UserRole" ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT;
ALTER TABLE "UserRole" ALTER COLUMN "userId" SET DATA TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserRole_id_seq";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInteraction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPricingRule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerType" "CustomerType",
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fixedPrice" DECIMAL(12,2),
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateId" TEXT,
    "quotationId" TEXT,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "CustomerInteraction_customerId_idx" ON "CustomerInteraction"("customerId");

-- CreateIndex
CREATE INDEX "CustomerInteraction_userId_idx" ON "CustomerInteraction"("userId");

-- CreateIndex
CREATE INDEX "CustomerInteraction_type_idx" ON "CustomerInteraction"("type");

-- CreateIndex
CREATE INDEX "CustomerInteraction_createdAt_idx" ON "CustomerInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "ProductPricingRule_productId_idx" ON "ProductPricingRule"("productId");

-- CreateIndex
CREATE INDEX "ProductPricingRule_customerType_idx" ON "ProductPricingRule"("customerType");

-- CreateIndex
CREATE INDEX "ProductPricingRule_validFrom_validUntil_idx" ON "ProductPricingRule"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "EmailTemplate_name_idx" ON "EmailTemplate"("name");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailLog_recipientEmail_idx" ON "EmailLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "EmailLog_quotationId_idx" ON "EmailLog"("quotationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE INDEX "Customer_customerType_idx" ON "Customer"("customerType");

-- CreateIndex
CREATE INDEX "Customer_isActive_idx" ON "Customer"("isActive");

-- CreateIndex
CREATE INDEX "File_key_idx" ON "File"("key");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Quotation_quotationNumber_idx" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

-- CreateIndex
CREATE INDEX "Quotation_validUntil_idx" ON "Quotation"("validUntil");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPricingRule" ADD CONSTRAINT "ProductPricingRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

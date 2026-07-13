/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "paymentMethod" SET DEFAULT 'Stripe';

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripeSessionId_key" ON "orders"("stripeSessionId");

-- CreateTable
CREATE TABLE "DeliverySite" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "contact" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverySite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiatedPrice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiatedPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverySite_userId_idx" ON "DeliverySite"("userId");

-- CreateIndex
CREATE INDEX "NegotiatedPrice_userId_idx" ON "NegotiatedPrice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NegotiatedPrice_userId_productId_key" ON "NegotiatedPrice"("userId", "productId");

-- AddForeignKey
ALTER TABLE "DeliverySite" ADD CONSTRAINT "DeliverySite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiatedPrice" ADD CONSTRAINT "NegotiatedPrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

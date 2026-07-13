-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CONSUMER';

-- CreateTable
CREATE TABLE "AccountApplication" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "businessName" TEXT,
    "abn" TEXT,
    "businessType" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "organisation" TEXT,
    "creditApproved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountApplication_userId_key" ON "AccountApplication"("userId");

-- CreateIndex
CREATE INDEX "AccountApplication_status_idx" ON "AccountApplication"("status");

-- AddForeignKey
ALTER TABLE "AccountApplication" ADD CONSTRAINT "AccountApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

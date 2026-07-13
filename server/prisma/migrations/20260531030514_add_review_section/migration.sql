/*
  Warnings:

  - You are about to drop the column `sized` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `_ProductToReviews` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `Reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ProductToReviews" DROP CONSTRAINT "_ProductToReviews_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToReviews" DROP CONSTRAINT "_ProductToReviews_B_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "sized",
ADD COLUMN     "sizes" TEXT[];

-- AlterTable
ALTER TABLE "Reviews" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT DEFAULT 'USER';

-- DropTable
DROP TABLE "_ProductToReviews";

-- CreateIndex
CREATE UNIQUE INDEX "Reviews_userId_productId_key" ON "Reviews"("userId", "productId");

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

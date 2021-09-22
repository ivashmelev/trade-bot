/*
  Warnings:

  - You are about to drop the column `name` on the `StopLossOrder` table. All the data in the column will be lost.
  - You are about to drop the column `telegramId` on the `StopLossOrder` table. All the data in the column will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `StopLossOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `StopLossOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StopLossOrder" DROP COLUMN "name",
DROP COLUMN "telegramId",
ADD COLUMN     "price" TEXT NOT NULL,
ADD COLUMN     "quantity" TEXT NOT NULL;

-- DropTable
DROP TABLE "Order";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

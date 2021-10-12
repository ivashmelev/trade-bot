/*
  Warnings:

  - Changed the type of `creationTime` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `eventTime` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderListId` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderTime` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tradeId` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "creationTime",
ADD COLUMN     "creationTime" BIGINT NOT NULL,
DROP COLUMN "eventTime",
ADD COLUMN     "eventTime" BIGINT NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
DROP COLUMN "orderListId",
ADD COLUMN     "orderListId" INTEGER NOT NULL,
DROP COLUMN "orderTime",
ADD COLUMN     "orderTime" BIGINT NOT NULL,
DROP COLUMN "tradeId",
ADD COLUMN     "tradeId" INTEGER NOT NULL;

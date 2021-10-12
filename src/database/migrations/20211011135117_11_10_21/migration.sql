/*
  Warnings:

  - You are about to drop the column `commission` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `commissionAsset` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `creationTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `eventTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `executionType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `icebergQuantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isBuyerMaker` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isOrderWorking` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `lastQuoteTransacted` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `lastTradeQuantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `newClientOrderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderListId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderRejectReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `originalClientOrderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `priceLastTrade` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quoteOrderQuantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `timeInForce` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuoteTradeQuantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalTradeQuantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `tradeId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `quoteQuantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "commission",
DROP COLUMN "commissionAsset",
DROP COLUMN "creationTime",
DROP COLUMN "eventTime",
DROP COLUMN "eventType",
DROP COLUMN "executionType",
DROP COLUMN "icebergQuantity",
DROP COLUMN "isBuyerMaker",
DROP COLUMN "isOrderWorking",
DROP COLUMN "lastQuoteTransacted",
DROP COLUMN "lastTradeQuantity",
DROP COLUMN "newClientOrderId",
DROP COLUMN "orderId",
DROP COLUMN "orderListId",
DROP COLUMN "orderRejectReason",
DROP COLUMN "orderStatus",
DROP COLUMN "orderTime",
DROP COLUMN "orderType",
DROP COLUMN "originalClientOrderId",
DROP COLUMN "priceLastTrade",
DROP COLUMN "quoteOrderQuantity",
DROP COLUMN "timeInForce",
DROP COLUMN "totalQuoteTradeQuantity",
DROP COLUMN "totalTradeQuantity",
DROP COLUMN "tradeId",
ADD COLUMN     "quoteQuantity" TEXT NOT NULL,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

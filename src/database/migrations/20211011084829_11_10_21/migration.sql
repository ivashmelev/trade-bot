-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "commission" TEXT NOT NULL,
    "commissionAsset" TEXT NOT NULL,
    "creationTime" TEXT NOT NULL,
    "eventTime" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "executionType" TEXT NOT NULL,
    "icebergQuantity" TEXT NOT NULL,
    "isBuyerMaker" BOOLEAN NOT NULL,
    "isOrderWorking" BOOLEAN NOT NULL,
    "lastQuoteTransacted" TEXT NOT NULL,
    "lastTradeQuantity" TEXT NOT NULL,
    "newClientOrderId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderListId" TEXT NOT NULL,
    "orderRejectReason" TEXT NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "orderTime" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "originalClientOrderId" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceLastTrade" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "quoteOrderQuantity" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "stopPrice" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeInForce" TEXT NOT NULL,
    "totalQuoteTradeQuantity" TEXT NOT NULL,
    "totalTradeQuantity" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Error" (
    "id" SERIAL NOT NULL,
    "time" INTEGER NOT NULL,
    "message" TEXT,
    "url" TEXT,

    PRIMARY KEY ("id")
);

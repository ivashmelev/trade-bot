-- CreateTable
CREATE TABLE "StopLossOrder" (
    "id" SERIAL NOT NULL,
    "price" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

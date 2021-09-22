/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "StopLossOrder" (
    "id" SERIAL NOT NULL,
    "telegramId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

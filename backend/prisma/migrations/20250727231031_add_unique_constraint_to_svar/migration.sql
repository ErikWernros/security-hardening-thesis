/*
  Warnings:

  - A unique constraint covering the columns `[userId,kravId]` on the table `Svar` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Svar_userId_kravId_key" ON "Svar"("userId", "kravId");

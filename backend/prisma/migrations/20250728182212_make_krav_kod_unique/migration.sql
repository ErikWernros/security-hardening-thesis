/*
  Warnings:

  - A unique constraint covering the columns `[kod,delId]` on the table `Avsnitt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kod]` on the table `Del` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kod]` on the table `Krav` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kod,avsnittId]` on the table `Stycke` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kravId,userId]` on the table `Svar` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Svar_userId_kravId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Avsnitt_kod_delId_key" ON "Avsnitt"("kod", "delId");

-- CreateIndex
CREATE UNIQUE INDEX "Del_kod_key" ON "Del"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "Krav_kod_key" ON "Krav"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "Stycke_kod_avsnittId_key" ON "Stycke"("kod", "avsnittId");

-- CreateIndex
CREATE UNIQUE INDEX "Svar_kravId_userId_key" ON "Svar"("kravId", "userId");

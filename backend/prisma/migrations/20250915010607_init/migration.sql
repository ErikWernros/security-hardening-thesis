-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Assessor', 'Viewer');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Viewer',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Del" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "namn" TEXT NOT NULL,

    CONSTRAINT "Del_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avsnitt" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "delId" INTEGER NOT NULL,

    CONSTRAINT "Avsnitt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Omrade" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "avsnittId" INTEGER NOT NULL,

    CONSTRAINT "Omrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stycke" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "omradeId" INTEGER NOT NULL,

    CONSTRAINT "Stycke_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Krav" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "kravText" TEXT NOT NULL,
    "anvisning" TEXT,
    "avsnittId" INTEGER,
    "omradeId" INTEGER,
    "styckeId" INTEGER,

    CONSTRAINT "Krav_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Svar" (
    "id" SERIAL NOT NULL,
    "betyg" INTEGER,
    "jaNej" BOOLEAN,
    "verifikat" TEXT,
    "kommentar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kravId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Svar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Del_kod_key" ON "Del"("kod");

-- CreateIndex
CREATE INDEX "Avsnitt_delId_idx" ON "Avsnitt"("delId");

-- CreateIndex
CREATE UNIQUE INDEX "Avsnitt_kod_delId_key" ON "Avsnitt"("kod", "delId");

-- CreateIndex
CREATE INDEX "Omrade_avsnittId_idx" ON "Omrade"("avsnittId");

-- CreateIndex
CREATE UNIQUE INDEX "Omrade_kod_avsnittId_key" ON "Omrade"("kod", "avsnittId");

-- CreateIndex
CREATE INDEX "Stycke_omradeId_idx" ON "Stycke"("omradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Stycke_kod_omradeId_key" ON "Stycke"("kod", "omradeId");

-- CreateIndex
CREATE INDEX "Krav_avsnittId_idx" ON "Krav"("avsnittId");

-- CreateIndex
CREATE INDEX "Krav_omradeId_idx" ON "Krav"("omradeId");

-- CreateIndex
CREATE INDEX "Krav_styckeId_idx" ON "Krav"("styckeId");

-- CreateIndex
CREATE UNIQUE INDEX "Krav_avsnittId_kod_key" ON "Krav"("avsnittId", "kod");

-- CreateIndex
CREATE UNIQUE INDEX "Krav_omradeId_kod_key" ON "Krav"("omradeId", "kod");

-- CreateIndex
CREATE UNIQUE INDEX "Krav_styckeId_kod_key" ON "Krav"("styckeId", "kod");

-- CreateIndex
CREATE UNIQUE INDEX "Svar_kravId_userId_key" ON "Svar"("kravId", "userId");

-- AddForeignKey
ALTER TABLE "Avsnitt" ADD CONSTRAINT "Avsnitt_delId_fkey" FOREIGN KEY ("delId") REFERENCES "Del"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Omrade" ADD CONSTRAINT "Omrade_avsnittId_fkey" FOREIGN KEY ("avsnittId") REFERENCES "Avsnitt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stycke" ADD CONSTRAINT "Stycke_omradeId_fkey" FOREIGN KEY ("omradeId") REFERENCES "Omrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Krav" ADD CONSTRAINT "Krav_avsnittId_fkey" FOREIGN KEY ("avsnittId") REFERENCES "Avsnitt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Krav" ADD CONSTRAINT "Krav_omradeId_fkey" FOREIGN KEY ("omradeId") REFERENCES "Omrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Krav" ADD CONSTRAINT "Krav_styckeId_fkey" FOREIGN KEY ("styckeId") REFERENCES "Stycke"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Svar" ADD CONSTRAINT "Svar_kravId_fkey" FOREIGN KEY ("kravId") REFERENCES "Krav"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Svar" ADD CONSTRAINT "Svar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

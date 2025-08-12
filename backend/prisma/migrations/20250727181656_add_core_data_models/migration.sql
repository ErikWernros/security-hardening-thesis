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
CREATE TABLE "Stycke" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "avsnittId" INTEGER NOT NULL,

    CONSTRAINT "Stycke_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Krav" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "kravText" TEXT NOT NULL,
    "anvisning" TEXT,
    "styckeId" INTEGER NOT NULL,

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

-- AddForeignKey
ALTER TABLE "Avsnitt" ADD CONSTRAINT "Avsnitt_delId_fkey" FOREIGN KEY ("delId") REFERENCES "Del"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stycke" ADD CONSTRAINT "Stycke_avsnittId_fkey" FOREIGN KEY ("avsnittId") REFERENCES "Avsnitt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Krav" ADD CONSTRAINT "Krav_styckeId_fkey" FOREIGN KEY ("styckeId") REFERENCES "Stycke"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Svar" ADD CONSTRAINT "Svar_kravId_fkey" FOREIGN KEY ("kravId") REFERENCES "Krav"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Svar" ADD CONSTRAINT "Svar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Svar" DROP CONSTRAINT "Svar_kravId_fkey";

-- AddForeignKey
ALTER TABLE "Svar" ADD CONSTRAINT "Svar_kravId_fkey" FOREIGN KEY ("kravId") REFERENCES "Krav"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `favoriteSport` on the `PlayerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlayerProfile" DROP COLUMN "favoriteSport",
ADD COLUMN     "favoriteSportId" TEXT;

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_favoriteSportId_fkey" FOREIGN KEY ("favoriteSportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

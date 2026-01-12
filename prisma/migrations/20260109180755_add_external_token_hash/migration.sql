/*
  Warnings:

  - You are about to drop the column `externalToken` on the `Shop` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "externalTokenHash" TEXT,
    "tokenViewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Shop" ("createdAt", "id", "shopDomain", "tokenViewedAt", "updatedAt") SELECT "createdAt", "id", "shopDomain", "tokenViewedAt", "updatedAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");
CREATE UNIQUE INDEX "Shop_externalTokenHash_key" ON "Shop"("externalTokenHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

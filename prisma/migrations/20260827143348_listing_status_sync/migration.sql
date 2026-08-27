-- CreateTable
CREATE TABLE "ListingStatusLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerageId" TEXT NOT NULL,
    "propertyId" TEXT,
    "mlsNumber" TEXT,
    "address" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingStatusLog_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingStatusLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerageId" TEXT NOT NULL,
    "mlsNumber" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "listPrice" REAL,
    "bedrooms" INTEGER,
    "bathrooms" REAL,
    "squareFeet" INTEGER,
    "lotSize" REAL,
    "yearBuilt" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "mlsStatus" TEXT,
    "source" TEXT,
    "lastSyncedAt" DATETIME,
    "contactId" TEXT,
    "listedDate" DATETIME,
    "soldDate" DATETIME,
    "soldPrice" REAL,
    "listingAgentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Property_listingAgentId_fkey" FOREIGN KEY ("listingAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "bathrooms", "bedrooms", "brokerageId", "city", "createdAt", "description", "id", "listPrice", "listedDate", "listingAgentId", "lotSize", "mlsNumber", "propertyType", "soldDate", "soldPrice", "squareFeet", "state", "status", "updatedAt", "yearBuilt", "zip") SELECT "address", "bathrooms", "bedrooms", "brokerageId", "city", "createdAt", "description", "id", "listPrice", "listedDate", "listingAgentId", "lotSize", "mlsNumber", "propertyType", "soldDate", "soldPrice", "squareFeet", "state", "status", "updatedAt", "yearBuilt", "zip" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_mlsNumber_key" ON "Property"("mlsNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ListingStatusLog_propertyId_idx" ON "ListingStatusLog"("propertyId");

-- CreateIndex
CREATE INDEX "ListingStatusLog_mlsNumber_idx" ON "ListingStatusLog"("mlsNumber");

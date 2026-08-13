-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "triggerCondition" TEXT,
    "actions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workflow_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "rawText" TEXT,
    "rawXml" TEXT,
    "qrBase64" TEXT,
    "sellerName" TEXT,
    "vatNumber" TEXT,
    "invoiceDate" TEXT,
    "totalAmount" TEXT,
    "vatAmount" TEXT,
    "xmlHash" TEXT,
    "ecdsaSig" TEXT,
    "publicKey" TEXT,
    "zatcaStamp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskScore" REAL,
    "riskLevel" TEXT
);

-- CreateTable
CREATE TABLE "InvoiceAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,
    "qrFound" BOOLEAN NOT NULL DEFAULT false,
    "vatNumberValid" BOOLEAN NOT NULL DEFAULT false,
    "dateValid" BOOLEAN NOT NULL DEFAULT false,
    "hashPresent" BOOLEAN NOT NULL DEFAULT false,
    "sigPresent" BOOLEAN NOT NULL DEFAULT false,
    "vatCalcValid" BOOLEAN NOT NULL DEFAULT false,
    "totalCalcValid" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "aiSummaryAr" TEXT,
    "aiConfidence" REAL,
    "explanation" TEXT,
    "explanationAr" TEXT,
    CONSTRAINT "InvoiceAnalysis_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageAr" TEXT NOT NULL,
    CONSTRAINT "FraudFlag_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceAnalysis_invoiceId_key" ON "InvoiceAnalysis"("invoiceId");

// ─── ZATCA QR TLV Decoded Fields ──────────────────────────────────────────
// Source: ZATCA Security Features Implementation Standard v1.1
// QR code encodes data in Tag-Length-Value (TLV) format, Base64 encoded.

export interface ZatcaQrFields {
  /** Tag 1 — Seller name */
  sellerName?: string;
  /** Tag 2 — VAT Registration Number (15 digits, starts & ends with 3) */
  vatNumber?: string;
  /** Tag 3 — Invoice timestamp ISO 8601 (e.g. 2022-02-21T12:13:57Z) */
  timestamp?: string;
  /** Tag 4 — Invoice total amount with VAT (SAR) */
  totalWithVat?: string;
  /** Tag 5 — VAT total amount (SAR) */
  vatAmount?: string;
  /** Tag 6 — SHA-256 hash of the XML invoice (Base64) — from Jan 2023 */
  invoiceHash?: string;
  /** Tag 7 — ECDSA signature of the invoice hash (Base64) */
  ecdsaSignature?: string;
  /** Tag 8 — ECDSA public key from signing private key (Base64) */
  publicKey?: string;
  /** Tag 9 — ZATCA CA stamp for simplified invoices (Base64) */
  zatcaStamp?: string;
}

// ─── Fraud Rule Result ────────────────────────────────────────────────────

export type RuleStatus = "PASS" | "FAIL" | "WARN" | "SKIP";

export interface RuleResult {
  /** Rule identifier matching ZATCA BR-KSA codes where applicable */
  ruleId: string;
  /** Human-readable rule name */
  ruleName: string;
  /** Arabic name */
  ruleNameAr: string;
  /** PASS / FAIL / WARN / SKIP */
  status: RuleStatus;
  /** Detailed message */
  message: string;
  /** Arabic message */
  messageAr: string;
  /** Risk weight 0–100 (contribution to overall score) */
  weight: number;
  /** Actual value found */
  actual?: string;
  /** Expected value */
  expected?: string;
}

// ─── Full Analysis Report ─────────────────────────────────────────────────

export type Verdict = "CLEAN" | "SUSPICIOUS" | "FRAUD" | "PENDING";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export interface AnalysisReport {
  verdict: Verdict;
  riskScore: number;     // 0–100
  riskLevel: RiskLevel;
  rules: RuleResult[];
  summary: string;
  summaryAr: string;
  qrFields?: ZatcaQrFields;
  qrFound: boolean;
  processingMs?: number;
}

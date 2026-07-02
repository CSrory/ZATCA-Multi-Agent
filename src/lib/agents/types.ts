import type { ZATCAQRData } from "@/lib/zatca/tlv-decoder";

// ─── Shared input for all agents ─────────────────────────────────────────────

export interface AgentInput {
  invoiceId:  string;
  fileUrl:    string;
  fileBuffer: Buffer;
  mimeType:   string;
  rawText:    string;
  qrData:     ZATCAQRData | null;
}

// ─── Shared output ────────────────────────────────────────────────────────────

export type AgentStatus = "PASS" | "SUSPICIOUS" | "CRITICAL" | "ERROR";

export interface AgentFinding {
  code:      string;
  severity:  "INFO" | "WARNING" | "CRITICAL";
  messageEn: string;
  messageAr: string;
}

export interface AgentResult {
  agentName:   "VISION" | "FORENSICS" | "MARKET";
  status:      AgentStatus;
  confidence:  number;           // 0.0–1.0
  findings:    AgentFinding[];
  summary:     string;
  summaryAr:   string;
  durationMs:  number;
  model:       string;           // "gpt-4o" | "gpt-4o-mini" | "deterministic"

  // ── Hard Override fields ─────────────────────────────────
  /**
   * VISION: total amount visually extracted from the document face.
   * Used to compare with ZATCA QR Tag 4 — mismatch = instant FRAUD.
   */
  extractedTotal?: string | null;

  /**
   * FORENSICS: true when metadata analysis confirms the file was
   * modified after its invoice date (e.g., PDF ModDate > invoice date).
   * Triggers the Hard Override to FRAUD immediately.
   */
  isTampered?: boolean;
}

// ─── Hard Override result ─────────────────────────────────────────────────────

export interface HardOverride {
  triggered: boolean;
  reasons:   string[];
}

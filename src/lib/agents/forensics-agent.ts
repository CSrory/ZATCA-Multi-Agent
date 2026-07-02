/**
 * Forensics Agent — Vercel AI SDK + generateObject
 *
 * Analyzes file metadata and structural properties for post-generation tampering.
 *
 * KEY HARD-OVERRIDE FIELD:
 *   result.isTampered — set to true when:
 *     • PDF ModDate is strictly AFTER the invoice date from QR Tag 3
 *     • Or a CRITICAL metadata finding is confirmed by AI
 *   Triggers instant FRAUD override in /api/analyze.
 *
 * Stability guarantee:
 *   generateObject with z.object schema + full deterministic fallback.
 *   This function NEVER throws — it always returns a valid AgentResult.
 */

import { generateObject }  from "ai";
import { z }               from "zod";
import { getTextModel, getModelLabel, isLlmConfigured } from "./llm";
import type { AgentInput, AgentResult, AgentFinding } from "./types";

const AGENT_NAME = "FORENSICS" as const;

const SUSPICIOUS_PRODUCERS = [
  "ghostscript", "pdfedit", "pdfsharp", "ilovepdf", "smallpdf",
  "pdf24", "cutepdf", "bullzip", "microsoft print to pdf", "nitro",
];

// ─── Zod output schema ────────────────────────────────────────────────────────

const ForensicsOutputSchema = z.object({
  /**
   * Hard Override trigger: true when evidence confirms the document was
   * modified AFTER it was originally generated / after its invoice date.
   */
  isTampered:         z.boolean(),
  /** Human-readable evidence summary for why isTampered is true (or null) */
  tamperedEvidence:   z.string().nullable(),
  /** Detected PDF producer software (or null if not determinable) */
  pdfProducer:        z.string().nullable(),
  /** True if modification date is after the invoice date */
  modifiedAfterInvoiceDate: z.boolean(),
  /** Additional forensic findings */
  findings: z.array(
    z.object({
      code:      z.string(),
      severity:  z.enum(["INFO", "WARNING", "CRITICAL"]),
      messageEn: z.string(),
      messageAr: z.string(),
    })
  ),
  confidence:   z.number().min(0).max(1),
  summary:      z.string(),
  summaryAr:    z.string(),
});

type ForensicsOutput = z.infer<typeof ForensicsOutputSchema>;

// ─── Main agent ───────────────────────────────────────────────────────────────

export async function runForensicsAgent(input: AgentInput): Promise<AgentResult> {
  const start = Date.now();

  // Deterministic metadata analysis always runs first
  const deterministicOutput = analyzeMetadata(input);

  if (!isLlmConfigured()) {
    return buildResult(deterministicOutput, Date.now() - start, "deterministic");
  }

  try {
    const prompt = `You are a digital forensics expert for ZATCA e-invoice fraud detection.
Analyze the document metadata and content for signs of post-generation tampering.

File Information:
- MIME type: ${input.mimeType}
- File size: ${input.fileBuffer.length} bytes
- Invoice date from QR: ${input.qrData?.timestamp ?? "unknown"}
- Seller from QR: ${input.qrData?.sellerName ?? "unknown"}

Deterministic metadata findings:
${deterministicOutput.findings.map((f) => `[${f.severity}] ${f.code}: ${f.messageEn}`).join("\n") || "None detected"}

isTampered (deterministic): ${deterministicOutput.isTampered}
PDF Producer (if applicable): ${deterministicOutput.pdfProducer ?? "not detected"}

Document text snippet (first 600 chars):
${input.rawText.slice(0, 600)}

Based on this analysis, determine if the invoice was tampered with after its original generation.
Set isTampered=true ONLY if there is concrete evidence of post-generation modification.`;

    const modelLabel = getModelLabel("text");

    const { object } = await generateObject({
      model:       getTextModel(),
      schema:      ForensicsOutputSchema,
      messages:    [{ role: "user", content: prompt }],
      temperature: 0,
    });

    // Hard rule: if deterministic found tampering, AI cannot override it to false
    const finalOutput: ForensicsOutput = {
      ...object,
      isTampered: deterministicOutput.isTampered || object.isTampered,
      findings:   mergeFindings(deterministicOutput.findings, object.findings),
    };

    return buildResult(finalOutput, Date.now() - start, modelLabel);

  } catch (err) {
    console.error("[ForensicsAgent] generateObject failed:", err);
    return buildResult(deterministicOutput, Date.now() - start, "deterministic");
  }
}

// ─── Deterministic metadata analysis ─────────────────────────────────────────

function analyzeMetadata(input: AgentInput): ForensicsOutput {
  const findings: AgentFinding[] = [];
  let isTampered = false;
  let pdfProducer: string | null = null;
  let modifiedAfterInvoiceDate = false;

  if (input.mimeType.includes("pdf") && input.fileBuffer.length > 0) {
    const pdfText = input.fileBuffer.toString("binary");

    // PDF magic bytes check
    if (!input.fileBuffer.slice(0, 8).toString("ascii").startsWith("%PDF-")) {
      findings.push({ code: "FORENSICS-01", severity: "CRITICAL", messageEn: "Invalid PDF header — file may be renamed or corrupted", messageAr: "رأس PDF غير صالح — قد يكون الملف مُغيَّر الامتداد أو تالفاً" });
      isTampered = true;
    }

    // Producer check
    const producerMatch = pdfText.match(/\/Producer\s*\(([^)]{1,100})\)/i);
    if (producerMatch) {
      pdfProducer = producerMatch[1].trim();
      const isSuspicious = SUSPICIOUS_PRODUCERS.some((s) => pdfProducer!.toLowerCase().includes(s));
      if (isSuspicious) {
        findings.push({ code: "FORENSICS-02", severity: "WARNING", messageEn: `PDF Producer "${pdfProducer}" is associated with document editing tools`, messageAr: `منتج PDF "${pdfProducer}" مرتبط بأدوات تحرير المستندات` });
      }
    }

    // Date mismatch check
    const creationMatch = pdfText.match(/\/CreationDate\s*\(([^)]+)\)/i);
    const modMatch      = pdfText.match(/\/ModDate\s*\(([^)]+)\)/i);

    if (creationMatch && modMatch) {
      const creation = parsePdfDate(creationMatch[1]);
      const mod      = parsePdfDate(modMatch[1]);

      if (creation && mod) {
        const diffHours = (mod.getTime() - creation.getTime()) / 3_600_000;

        if (diffHours > 1) {
          const severity = diffHours > 24 ? "CRITICAL" : "WARNING";
          findings.push({ code: "FORENSICS-03", severity, messageEn: `PDF modified ${diffHours.toFixed(1)}h after creation (CreationDate ≠ ModDate)`, messageAr: `تم تعديل PDF بعد ${diffHours.toFixed(1)} ساعة من الإنشاء` });
          if (severity === "CRITICAL") isTampered = true;
        }

        // Compare ModDate with invoice date from QR Tag 3
        if (input.qrData?.timestamp) {
          const invoiceDate = new Date(input.qrData.timestamp);
          if (mod > invoiceDate) {
            const diffDays = (mod.getTime() - invoiceDate.getTime()) / 86_400_000;
            if (diffDays > 1) {
              modifiedAfterInvoiceDate = true;
              isTampered = true;
              findings.push({ code: "FORENSICS-04", severity: "CRITICAL", messageEn: `PDF modified ${diffDays.toFixed(0)} day(s) AFTER invoice date — confirms post-generation tampering`, messageAr: `تم تعديل PDF بعد ${diffDays.toFixed(0)} يوم من تاريخ الفاتورة — يؤكد التلاعب بعد الإنشاء` });
            }
          }
        }
      }
    }

    // Multiple EOF markers
    const eofCount = (pdfText.match(/%%EOF/g) ?? []).length;
    if (eofCount > 2) {
      findings.push({ code: "FORENSICS-05", severity: "WARNING", messageEn: `PDF has ${eofCount} EOF markers — possible incremental update or content injection`, messageAr: `يحتوي PDF على ${eofCount} علامات EOF — احتمال تحديث تدريجي أو حقن محتوى` });
    }
  }

  // File size anomaly
  if (input.mimeType.includes("pdf") && input.fileBuffer.length > 0 && input.fileBuffer.length < 5_120) {
    findings.push({ code: "FORENSICS-06", severity: "WARNING", messageEn: `File is very small (${(input.fileBuffer.length / 1024).toFixed(1)} KB) for a PDF invoice`, messageAr: `الملف صغير جداً (${(input.fileBuffer.length / 1024).toFixed(1)} كيلوبايت) بالنسبة لفاتورة PDF` });
  }

  const evidence = isTampered
    ? findings.filter((f) => f.severity === "CRITICAL").map((f) => f.messageEn).join("; ")
    : null;

  return {
    isTampered,
    tamperedEvidence:        evidence,
    pdfProducer,
    modifiedAfterInvoiceDate,
    findings,
    confidence: 0.75,
    summary:    isTampered
      ? `TAMPERED: ${evidence}`
      : findings.length === 0 ? "No metadata anomalies detected." : `${findings.length} metadata warning(s) detected.`,
    summaryAr: isTampered
      ? `مُلاعَب به: ${evidence}`
      : findings.length === 0 ? "لم يتم اكتشاف أي شذوذات في البيانات الوصفية." : `تم اكتشاف ${findings.length} تحذير(ات) في البيانات الوصفية.`,
  };
}

// ─── Build AgentResult from schema output ────────────────────────────────────

function buildResult(o: ForensicsOutput, durationMs: number, model: string): AgentResult {
  const criticals = o.findings.filter((f) => f.severity === "CRITICAL").length;
  const status    = o.isTampered || criticals > 0 ? "CRITICAL"
    : o.findings.some((f) => f.severity === "WARNING") ? "SUSPICIOUS" : "PASS";

  return {
    agentName:  AGENT_NAME,
    status,
    confidence: o.confidence,
    findings:   o.findings,
    summary:    o.summary,
    summaryAr:  o.summaryAr,
    durationMs,
    model,
    isTampered: o.isTampered,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePdfDate(raw: string): Date | null {
  const m = raw.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
}

function mergeFindings(base: AgentFinding[], extra: AgentFinding[]): AgentFinding[] {
  return [...base, ...extra.filter((e) => !base.some((b) => b.code === e.code))];
}

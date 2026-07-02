/**
 * Vision Agent — Vercel AI SDK + generateObject
 *
 * Uses GPT-4o Vision to read the printed invoice face and compare
 * against ZATCA TLV-decoded QR values.
 *
 * KEY HARD-OVERRIDE FIELD:
 *   result.extractedTotal — the total amount visually read from the document.
 *   If this differs from QR Tag 4 by > 1 SAR, the API applies an instant
 *   FRAUD override (no weighted scoring).
 *
 * Stability guarantee:
 *   generateObject with z.object schema + graceful deterministic fallback.
 *   This function NEVER throws — it always returns a valid AgentResult.
 */

import { generateObject }  from "ai";
import { z }               from "zod";
import { getVisionModel, getModelLabel, isLlmConfigured } from "./llm";
import type { AgentInput, AgentResult, AgentFinding } from "./types";

const AGENT_NAME = "VISION" as const;

// ─── Strict Zod output schema ─────────────────────────────────────────────────

const VisionOutputSchema = z.object({
  /** Seller name as visually readable on the document */
  sellerNameVisible:    z.string().nullable(),
  /** VAT number as visually printed */
  vatNumberVisible:     z.string().nullable(),
  /**
   * Invoice total (with VAT) as printed on the document face.
   * CRITICAL: used for Hard Override comparison with ZATCA QR Tag 4.
   */
  totalAmountExtracted: z.string().nullable(),
  /** VAT amount as visually printed */
  vatAmountVisible:     z.string().nullable(),
  /** Invoice date as visually printed */
  dateVisible:          z.string().nullable(),
  /** Array of mismatches between visual data and QR-decoded data */
  discrepancies: z.array(
    z.object({
      field:    z.string().describe("Field name, e.g. 'total', 'vatNumber'"),
      visual:   z.string().describe("Value as printed on document"),
      qr:       z.string().describe("Value from ZATCA QR code"),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    })
  ),
  /** Confidence score 0.0–1.0 */
  confidence:          z.number().min(0).max(1),
  /** English summary sentence */
  overallAssessment:   z.string(),
  /** Arabic summary sentence */
  overallAssessmentAr: z.string(),
});

type VisionOutput = z.infer<typeof VisionOutputSchema>;

// ─── Main agent ───────────────────────────────────────────────────────────────

export async function runVisionAgent(input: AgentInput): Promise<AgentResult> {
  const start = Date.now();

  if (!isLlmConfigured()) {
    return deterministicVision(input, Date.now() - start);
  }

  try {
    const systemPrompt = `You are a ZATCA e-invoice fraud detection specialist.
Read the invoice document and extract exactly what is visually printed.
Then compare each field with the ZATCA QR-decoded values provided.
A discrepancy between what is printed and what the QR encodes is a STRONG fraud indicator.
Be precise with amounts — extract the exact numeric string including decimals.`;

    const userPrompt = `ZATCA QR Decoded Values (ground truth from cryptographic stamp):
- Seller Name: ${input.qrData?.sellerName ?? "NOT IN QR"}
- VAT Number:  ${input.qrData?.vatNumber   ?? "NOT IN QR"}
- Date:        ${input.qrData?.timestamp   ?? "NOT IN QR"}
- Total (incl. VAT): ${input.qrData?.totalWithVat ?? "NOT IN QR"} SAR
- VAT Amount:  ${input.qrData?.vatTotal    ?? "NOT IN QR"} SAR

Document text extracted:
${input.rawText.slice(0, 1500)}

Carefully read the document. Extract visible amounts as exact numeric strings (e.g. "1150.00").
Report any discrepancy between what is printed and what the QR encodes.`;

    const imagePart = buildImageContentPart(input);

    const modelLabel = getModelLabel("vision");

    const { object } = await generateObject({
      model:       getVisionModel(),
      schema:      VisionOutputSchema,
      instructions: systemPrompt,
      messages:    [{
        role: "user",
        content: imagePart
          ? [{ type: "text", text: userPrompt }, imagePart]
          : userPrompt,
      }],
      temperature: 0,
    });

    return buildResult(object, Date.now() - start, modelLabel);

  } catch (err) {
    console.error("[VisionAgent] generateObject failed:", err);
    return deterministicVision(input, Date.now() - start);
  }
}

// ─── Build AgentResult from schema output ────────────────────────────────────

function buildResult(
  o: VisionOutput,
  durationMs: number,
  model: string
): AgentResult {
  const findings: AgentFinding[] = o.discrepancies.map((d, i) => ({
    code:      `VISION-${String(i + 1).padStart(2, "0")}`,
    severity:  d.severity === "HIGH" ? "CRITICAL" : d.severity === "MEDIUM" ? "WARNING" : "INFO",
    messageEn: `Visual/QR mismatch on "${d.field}": document shows "${d.visual}", QR encodes "${d.qr}"`,
    messageAr: `تناقض مرئي/QR في "${d.field}": المستند يُظهر "${d.visual}"، رمز QR يُشفّر "${d.qr}"`,
  }));

  const criticals = findings.filter((f) => f.severity === "CRITICAL").length;
  const status    = criticals > 0 ? "CRITICAL" : findings.length > 0 ? "SUSPICIOUS" : "PASS";

  return {
    agentName:      AGENT_NAME,
    status,
    confidence:     o.confidence,
    findings,
    summary:        o.overallAssessment,
    summaryAr:      o.overallAssessmentAr,
    durationMs,
    model,
    extractedTotal: o.totalAmountExtracted,
  };
}

// ─── Deterministic fallback (no API key) ─────────────────────────────────────

function deterministicVision(input: AgentInput, durationMs: number): AgentResult {
  const findings: AgentFinding[] = [];
  const { qrData, rawText } = input;
  let extractedTotal: string | null = null;

  // Try to extract a total from raw text (rough regex)
  const totalMatch = rawText.match(/(?:total|المجموع|الإجمالي)[^\d]*(\d[\d,]*\.?\d{0,2})/i);
  if (totalMatch) extractedTotal = totalMatch[1].replace(/,/g, "");

  if (!qrData) {
    return {
      agentName:  AGENT_NAME,
      status:     "SUSPICIOUS",
      confidence: 0.4,
      findings:   [{ code: "VISION-00", severity: "WARNING", messageEn: "No QR data for comparison", messageAr: "لا توجد بيانات QR للمقارنة" }],
      summary:    "Visual comparison skipped — no QR data.",
      summaryAr:  "تم تخطي المقارنة المرئية.",
      durationMs,
      model:      "deterministic",
      extractedTotal,
    };
  }

  if (qrData.sellerName && rawText && !rawText.toLowerCase().includes(qrData.sellerName.toLowerCase())) {
    findings.push({ code: "VISION-01", severity: "WARNING",  messageEn: `Seller "${qrData.sellerName}" not found in document text`, messageAr: `اسم البائع "${qrData.sellerName}" غير موجود في نص المستند` });
  }
  if (qrData.vatNumber && rawText && !rawText.includes(qrData.vatNumber)) {
    findings.push({ code: "VISION-02", severity: "CRITICAL", messageEn: `VAT number "${qrData.vatNumber}" not visible in document — possible face tampering`, messageAr: `الرقم الضريبي "${qrData.vatNumber}" غير مرئي في المستند — احتمال تلاعب بالواجهة` });
  }
  if (qrData.totalWithVat && rawText && !rawText.includes(qrData.totalWithVat)) {
    findings.push({ code: "VISION-03", severity: "WARNING",  messageEn: `Invoice total "${qrData.totalWithVat}" not found in document text`, messageAr: `إجمالي "${qrData.totalWithVat}" غير موجود في نص المستند` });
  }

  const criticals = findings.filter((f) => f.severity === "CRITICAL").length;
  const status    = criticals > 0 ? "CRITICAL" : findings.length > 0 ? "SUSPICIOUS" : "PASS";
  const summary   = findings.length === 0
    ? "Visual inspection passed — QR values consistent with document content."
    : `Found ${findings.length} visual discrepancy(ies).`;

  return {
    agentName:      AGENT_NAME,
    status,
    confidence:     0.55,
    findings,
    summary,
    summaryAr:      findings.length === 0
      ? "اجتاز الفحص المرئي — قيم QR متسقة مع محتوى المستند."
      : `تم اكتشاف ${findings.length} تناقض(ات) مرئي(ة).`,
    durationMs,
    model:          "deterministic",
    extractedTotal,
  };
}

/** Pass invoice image to vision model when buffer is available */
function buildImageContentPart(
  input: AgentInput
): { type: "image"; image: Buffer; mimeType?: string } | null {
  if (!input.fileBuffer.length) return null;
  const mime = input.mimeType.toLowerCase();
  if (!mime.startsWith("image/")) return null;
  return { type: "image", image: input.fileBuffer, mimeType: input.mimeType };
}

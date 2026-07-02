/**
 * Market Agent — Vercel AI SDK + generateObject
 *
 * Evaluates the commercial and pricing logic of the invoice.
 * Runs deterministic checks first, then enriches with GPT-4o analysis.
 *
 * Stability guarantee:
 *   generateObject with z.object schema + full deterministic fallback.
 *   This function NEVER throws — it always returns a valid AgentResult.
 */

import { generateObject }  from "ai";
import { z }               from "zod";
import { getTextModel, getModelLabel, isLlmConfigured } from "./llm";
import type { AgentInput, AgentResult, AgentFinding } from "./types";

const AGENT_NAME = "MARKET" as const;

// ─── Zod output schema ────────────────────────────────────────────────────────

const MarketOutputSchema = z.object({
  /** Overall commercial assessment */
  pricingAssessment: z.enum(["NORMAL", "SUSPICIOUS", "FRAUDULENT"]),
  /** Specific findings about pricing, quantities, or commercial patterns */
  findings: z.array(
    z.object({
      code:      z.string(),
      severity:  z.enum(["INFO", "WARNING", "CRITICAL"]),
      messageEn: z.string(),
      messageAr: z.string(),
    })
  ),
  /** Confidence score 0.0–1.0 */
  confidence:   z.number().min(0).max(1),
  /** English summary */
  summary:      z.string(),
  /** Arabic summary */
  summaryAr:    z.string(),
});

type MarketOutput = z.infer<typeof MarketOutputSchema>;

// ─── Main agent ───────────────────────────────────────────────────────────────

export async function runMarketAgent(input: AgentInput): Promise<AgentResult> {
  const start = Date.now();

  const deterministicOutput = analyzeCommercialLogic(input);

  if (!isLlmConfigured()) {
    return buildResult(deterministicOutput, Date.now() - start, "deterministic");
  }

  try {
    const systemPrompt = `You are a senior financial auditor specializing in Saudi Arabian corporate invoice fraud.
Analyze invoices for commercial plausibility: ghost vendors, inflated pricing, round-number schemes, suspicious VAT categories.
Be precise. Only flag genuine concerns, not normal business patterns.`;

    const userPrompt = `Analyze this ZATCA invoice for commercial fraud:

QR Decoded Data:
- Seller: ${input.qrData?.sellerName ?? "Unknown"}
- VAT Number: ${input.qrData?.vatNumber ?? "Unknown"}
- Total (incl. VAT): ${input.qrData?.totalWithVat ?? "Unknown"} SAR
- VAT Amount: ${input.qrData?.vatTotal ?? "Unknown"} SAR
- Date: ${input.qrData?.timestamp ?? "Unknown"}

Extracted Text:
${input.rawText.slice(0, 2000)}

Deterministic checks already ran:
${deterministicOutput.findings.map((f) => `[${f.severity}] ${f.messageEn}`).join("\n") || "None"}

Evaluate: (1) Are prices reasonable for Saudi B2B market? (2) Do line items follow logical patterns? (3) Are there signs of fictitious or inflated transactions?`;

    const modelLabel = getModelLabel("text");

    const { object } = await generateObject({
      model:       getTextModel(),
      schema:      MarketOutputSchema,
      instructions: systemPrompt,
      messages:    [{ role: "user", content: userPrompt }],
      temperature: 0.1,
    });

    const finalOutput: MarketOutput = {
      ...object,
      findings: mergeFindings(deterministicOutput.findings, object.findings),
    };

    return buildResult(finalOutput, Date.now() - start, modelLabel);

  } catch (err) {
    console.error("[MarketAgent] generateObject failed:", err);
    return buildResult(deterministicOutput, Date.now() - start, "deterministic");
  }
}

// ─── Deterministic commercial checks ─────────────────────────────────────────

function analyzeCommercialLogic(input: AgentInput): MarketOutput {
  const findings: AgentFinding[] = [];
  const { qrData, rawText } = input;

  if (!qrData) {
    return { pricingAssessment: "SUSPICIOUS", findings, confidence: 0.4, summary: "No QR data available.", summaryAr: "لا توجد بيانات QR." };
  }

  const total = parseFloat(qrData.totalWithVat ?? "0");
  const vat   = parseFloat(qrData.vatTotal     ?? "0");

  // Round-number inflation
  if (total % 1000 === 0 && total >= 10_000) {
    findings.push({ code: "MARKET-02", severity: "INFO", messageEn: `Invoice total is a round number (${total} SAR) — common in ghost/inflated invoices`, messageAr: `إجمالي الفاتورة رقم مستدير (${total} ريال) — نمط شائع في الفواتير الوهمية` });
  }

  // Very high amount
  if (total > 10_000_000) {
    findings.push({ code: "MARKET-03", severity: "WARNING", messageEn: `High invoice value: ${total.toLocaleString()} SAR — mandatory manual review required`, messageAr: `قيمة مرتفعة: ${total.toLocaleString()} ريال — يتطلب مراجعة يدوية إلزامية` });
  }

  // Effective VAT rate check
  if (total > 0 && vat > 0) {
    const rate = (vat / (total - vat)) * 100;
    if (rate > 16 || (rate < 14 && rate > 1)) {
      findings.push({ code: "MARKET-04", severity: "WARNING", messageEn: `Effective VAT rate is ${rate.toFixed(2)}% — deviates from the standard 15% KSA rate`, messageAr: `نسبة الضريبة الفعلية ${rate.toFixed(2)}% — تنحرف عن النسبة القياسية 15%` });
    }
  }

  // Test/demo seller name
  if (qrData.sellerName) {
    const n = qrData.sellerName.toLowerCase();
    if (["test", "demo", "sample", "اختبار", "نموذج"].some((t) => n.includes(t))) {
      findings.push({ code: "MARKET-05", severity: "CRITICAL", messageEn: `Seller name "${qrData.sellerName}" contains test/demo keywords — not a real entity`, messageAr: `اسم البائع "${qrData.sellerName}" يحتوي على كلمات اختبار — ليست جهة حقيقية` });
    }
  }

  // High-risk keywords
  const lowerText = rawText.toLowerCase();
  for (const { kw, ar } of HIGH_RISK_KEYWORDS) {
    if (lowerText.includes(kw) || rawText.includes(ar)) {
      findings.push({ code: "MARKET-06", severity: "INFO", messageEn: `High-risk keyword "${kw}" found — common in fictitious service invoices`, messageAr: `كلمة عالية الخطورة "${ar}" — شائعة في فواتير الخدمات الوهمية` });
      break;
    }
  }

  const criticals = findings.filter((f) => f.severity === "CRITICAL").length;
  const assessment: MarketOutput["pricingAssessment"] =
    criticals > 0 ? "FRAUDULENT" : findings.length >= 2 ? "SUSPICIOUS" : "NORMAL";

  return {
    pricingAssessment: assessment,
    findings,
    confidence: 0.65,
    summary:    findings.length === 0 ? "Commercial patterns appear legitimate." : `${findings.length} commercial concern(s) flagged.`,
    summaryAr:  findings.length === 0 ? "الأنماط التجارية تبدو مشروعة." : `تم الإشارة إلى ${findings.length} مخاوف تجارية.`,
  };
}

// ─── Build AgentResult from schema output ────────────────────────────────────

function buildResult(o: MarketOutput, durationMs: number, model: string): AgentResult {
  const criticals = o.findings.filter((f) => f.severity === "CRITICAL").length;
  const status    =
    o.pricingAssessment === "FRAUDULENT" || criticals > 0 ? "CRITICAL"
    : o.pricingAssessment === "SUSPICIOUS" ? "SUSPICIOUS"
    : "PASS";

  return {
    agentName:  AGENT_NAME,
    status,
    confidence: o.confidence,
    findings:   o.findings,
    summary:    o.summary,
    summaryAr:  o.summaryAr,
    durationMs,
    model,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HIGH_RISK_KEYWORDS = [
  { kw: "consulting",   ar: "استشارات" },
  { kw: "commission",   ar: "عمولة"    },
  { kw: "facilitation", ar: "تسهيل"   },
  { kw: "intermediary", ar: "وسيط"    },
];

function mergeFindings(base: AgentFinding[], extra: AgentFinding[]): AgentFinding[] {
  return [...base, ...extra.filter((e) => !base.some((b) => b.code === e.code))];
}

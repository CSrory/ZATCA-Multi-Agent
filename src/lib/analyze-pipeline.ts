/**
 * Core ZATCA + Multi-Agent analysis pipeline.
 * Used by /api/analyze — no database dependency.
 */

import { extractFromFile }       from "@/lib/zatca/qr-extractor";
import { decodeTLV }             from "@/lib/zatca/tlv-decoder";
import { validateZATCAInvoice }  from "@/lib/zatca/validator";
import { runVisionAgent }        from "@/lib/agents/vision-agent";
import { runForensicsAgent }     from "@/lib/agents/forensics-agent";
import { runMarketAgent }        from "@/lib/agents/market-agent";
import type { AgentInput, AgentResult } from "@/lib/agents/types";
import type { ZATCAQRData }      from "@/lib/zatca/tlv-decoder";

export interface ZATCAResult {
  qrData:    ZATCAQRData | null;
  qrBase64:  string | null;
  rawText:   string;
  rawXml:    string | null;
  strategy:  string;
  tlvErrors: string[];
  report:    ReturnType<typeof validateZATCAInvoice>;
}

export interface AnalyzePipelineInput {
  invoiceId: string;
  buffer:    Buffer;
  fileName:  string;
  mimeType:  string;
  fileUrl?:  string;
}

export interface AnalyzePipelineOutput {
  zatca:              ZATCAResult;
  finalVision:        AgentResult;
  finalForensics:     AgentResult;
  finalMarket:        AgentResult;
  hardOverride:       { triggered: boolean; reasons: string[] };
  consolidatedScore:  number;
  consolidatedLevel:  string;
  finalStatus:        string;
  pipelineMs:         number;
}

export async function decodeZatcaQr(
  buffer: Buffer,
  mimeType: string
): Promise<ZATCAResult> {
  const extracted  = await extractFromFile(buffer, mimeType);
  const qrBase64   = extracted.qrBase64;
  const tlvResult  = qrBase64 ? decodeTLV(qrBase64) : null;
  const qrData     = tlvResult?.data ?? null;
  const report     = validateZATCAInvoice(qrData, !!qrBase64);

  return {
    qrData,
    qrBase64,
    rawText:   extracted.rawText ?? "",
    rawXml:    extracted.rawXml  ?? null,
    strategy:  extracted.strategy,
    tlvErrors: tlvResult?.errors ?? [],
    report,
  };
}

export async function runAnalyzePipeline(
  input: AnalyzePipelineInput
): Promise<AnalyzePipelineOutput> {
  const pipelineStart = Date.now();
  const { invoiceId, buffer, mimeType } = input;
  const fileUrl = input.fileUrl ?? `inline://${input.fileName}`;

  const zatca = await decodeZatcaQr(buffer, mimeType);

  const baseAgentInput = (qrData: ZATCAQRData | null, rawText: string): AgentInput => ({
    invoiceId,
    fileUrl,
    fileBuffer: buffer,
    mimeType,
    rawText,
    qrData,
  });

  const [visionResult, forensicsResult, marketResult] = await Promise.all([
    runVisionAgent(baseAgentInput(null, "")),
    runForensicsAgent(baseAgentInput(null, "")),
    runMarketAgent(baseAgentInput(null, "")),
  ]);

  const enriched = baseAgentInput(zatca.qrData, zatca.rawText);

  const [visionFinal, marketFinal] = await Promise.all([
    zatca.qrData ? runVisionAgent(enriched) : Promise.resolve(visionResult),
    zatca.qrData ? runMarketAgent(enriched) : Promise.resolve(marketResult),
  ]);

  const mergeAgent = (a: AgentResult, b: AgentResult): AgentResult => ({
    ...b,
    findings: [
      ...a.findings,
      ...b.findings.filter((bf) => !a.findings.some((af) => af.code === bf.code)),
    ],
  });

  const finalVision    = mergeAgent(visionResult, visionFinal);
  const finalForensics = forensicsResult;
  const finalMarket    = mergeAgent(marketResult, marketFinal);

  const hardOverride = evaluateHardOverride(zatca, finalVision, finalForensics);

  const { consolidatedScore, consolidatedLevel, finalStatus } = hardOverride.triggered
    ? { consolidatedScore: 100, consolidatedLevel: "CRITICAL", finalStatus: "FRAUD" }
    : consolidateRisk(zatca.report.riskScore, finalVision, finalForensics, finalMarket);

  if (hardOverride.triggered) {
    hardOverride.reasons.forEach((reason, i) => {
      zatca.report.flags.unshift({
        ruleCode:  `HARD-OVERRIDE-${String(i + 1).padStart(2, "0")}`,
        severity:  "CRITICAL",
        messageEn: `[HARD OVERRIDE] ${reason}`,
        messageAr: `[تجاوز قسري] ${reason}`,
      });
    });
  }

  return {
    zatca,
    finalVision,
    finalForensics,
    finalMarket,
    hardOverride,
    consolidatedScore,
    consolidatedLevel,
    finalStatus,
    pipelineMs: Date.now() - pipelineStart,
  };
}

export function buildAnalyzeResponse(
  invoiceId: string,
  fileUrl: string,
  result: AnalyzePipelineOutput
) {
  const { zatca, finalVision, finalForensics, finalMarket } = result;

  return {
    success:      true,
    invoiceId,
    fileUrl,
    status:       result.finalStatus,
    riskScore:    result.consolidatedScore,
    riskLevel:    result.consolidatedLevel,
    pipelineMs:   result.pipelineMs,
    hardOverride: {
      triggered: result.hardOverride.triggered,
      reasons:   result.hardOverride.reasons,
    },
    zatca: {
      qrStrategy: zatca.strategy,
      checks:     zatca.report.checks,
      flags:      zatca.report.flags,
      riskScore:  zatca.report.riskScore,
      tlvErrors:  zatca.tlvErrors,
      qrDecoded: {
        sellerName:    zatca.qrData?.sellerName    ?? null,
        vatNumber:     zatca.qrData?.vatNumber     ?? null,
        timestamp:     zatca.qrData?.timestamp     ?? null,
        totalWithVat:  zatca.qrData?.totalWithVat  ?? null,
        vatTotal:      zatca.qrData?.vatTotal      ?? null,
        hasHash:       !!zatca.qrData?.xmlHash,
        hasSignature:  !!zatca.qrData?.ecdsaSignature,
        hasPublicKey:  !!zatca.qrData?.publicKey,
        hasZatcaStamp: !!zatca.qrData?.zatcaCaStamp,
      },
    },
    agents: {
      vision:    agentOut(finalVision),
      forensics: agentOut(finalForensics),
      market:    agentOut(finalMarket),
    },
    summary: {
      en: buildSummaryEN(zatca.report, finalVision, finalForensics, finalMarket),
      ar: buildSummaryAR(zatca.report, finalVision, finalForensics, finalMarket),
    },
  };
}

function agentOut(a: AgentResult) {
  return {
    status:     a.status,
    confidence: a.confidence,
    model:      a.model,
    durationMs: a.durationMs,
    findings:   a.findings,
    summary:    { en: a.summary, ar: a.summaryAr },
  };
}

function evaluateHardOverride(
  zatca:     ZATCAResult,
  vision:    AgentResult,
  forensics: AgentResult
): { triggered: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const visualTotal = parseFloat((vision.extractedTotal ?? "").replace(/,/g, ""));
  const qrTotal     = parseFloat((zatca.qrData?.totalWithVat ?? "").replace(/,/g, ""));

  if (!isNaN(visualTotal) && !isNaN(qrTotal) && qrTotal > 0) {
    const absDiff = Math.abs(visualTotal - qrTotal);
    const pctDiff = absDiff / qrTotal;
    if (absDiff > 1 || pctDiff > 0.001) {
      reasons.push(
        `Visual total (${visualTotal} SAR) ≠ ZATCA QR Tag 4 (${qrTotal} SAR). ` +
        `Diff: ${absDiff.toFixed(2)} SAR — invoice face altered after QR cryptographic stamping.`
      );
    }
  }

  if (forensics.isTampered) {
    const criticalEvidence = forensics.findings
      .filter((f) => f.severity === "CRITICAL")
      .map((f) => f.messageEn)
      .join("; ") || "Metadata confirms post-generation modification.";
    reasons.push(`File tampering confirmed: ${criticalEvidence}`);
  }

  return { triggered: reasons.length > 0, reasons };
}

function consolidateRisk(
  zatcaScore: number,
  v: AgentResult, f: AgentResult, m: AgentResult
) {
  const s = (a: AgentResult) => a.status === "CRITICAL" ? 100 : a.status === "SUSPICIOUS" ? 55 : 0;
  const consolidatedScore = Math.min(100, Math.round(
    zatcaScore * 0.40 + s(v) * 0.25 + s(f) * 0.20 + s(m) * 0.15
  ));
  const consolidatedLevel =
    consolidatedScore >= 75 ? "CRITICAL" :
    consolidatedScore >= 50 ? "HIGH"     :
    consolidatedScore >= 20 ? "MEDIUM"   : "LOW";
  const finalStatus =
    consolidatedScore >= 75 ? "FRAUD"      :
    consolidatedScore >= 30 ? "SUSPICIOUS" : "CLEAN";
  return { consolidatedScore, consolidatedLevel, finalStatus };
}

type ZR = ReturnType<typeof validateZATCAInvoice>;

function buildSummaryEN(z: ZR, v: AgentResult, f: AgentResult, m: AgentResult): string {
  const parts = [];
  if (z.flags.length) parts.push(`ZATCA: ${z.flags.length} violation(s).`);
  if (v.findings.length) parts.push(`Vision: ${v.summary}`);
  if (f.findings.length) parts.push(`Forensics: ${f.summary}`);
  if (m.findings.length) parts.push(`Market: ${m.summary}`);
  return parts.join(" | ") || "All agents passed — no fraud indicators detected.";
}

function buildSummaryAR(z: ZR, v: AgentResult, f: AgentResult, m: AgentResult): string {
  const parts = [];
  if (z.flags.length) parts.push(`هيئة الزكاة: ${z.flags.length} انتهاك(ات).`);
  if (v.findings.length) parts.push(`المرئي: ${v.summaryAr}`);
  if (f.findings.length) parts.push(`الجنائي: ${f.summaryAr}`);
  if (m.findings.length) parts.push(`التجاري: ${m.summaryAr}`);
  return parts.join(" | ") || "اجتازت جميع الوكلاء — لم يُكتشف أي مؤشرات احتيال.";
}

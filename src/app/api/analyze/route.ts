/**
 * POST /api/analyze
 *
 * Accepts multipart FormData with a `file` field (preferred, no DB/Storage needed),
 * or legacy JSON: { fileUrl, fileName, mimeType, fileSize }.
 *
 * Pipeline: ZATCA TLV decode + Vision + Forensics + Market agents.
 * Database persistence is optional (ENABLE_DATABASE=true).
 */

import { NextRequest, NextResponse } from "next/server";
import { isDatabaseEnabled }         from "@/lib/db-enabled";
import {
  runAnalyzePipeline,
  buildAnalyzeResponse,
} from "@/lib/analyze-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ParsedRequest {
  buffer:   Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl?: string;
}

async function parseRequest(req: NextRequest): Promise<ParsedRequest | NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  // ── Multipart: direct file upload (demo mode) ─────────────
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing file in FormData" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    return {
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    };
  }

  // ── JSON: legacy Supabase URL flow ────────────────────────
  let body: { fileUrl?: string; fileName?: string; mimeType?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request — send FormData with file or JSON body" }, { status: 400 });
  }

  const { fileUrl, fileName, mimeType, fileSize } = body;
  if (!fileName || !mimeType) {
    return NextResponse.json({ error: "Missing required fields: fileName, mimeType" }, { status: 400 });
  }

  if (!fileUrl || fileUrl.startsWith("local://")) {
    return NextResponse.json(
      { error: "Direct file upload required — Supabase Storage not configured" },
      { status: 400 }
    );
  }

  const fetchRes = await fetch(fileUrl);
  if (!fetchRes.ok) {
    return NextResponse.json({ error: `Failed to fetch file: ${fetchRes.statusText}` }, { status: 400 });
  }
  const buffer: Buffer = Buffer.from(await fetchRes.arrayBuffer());

  return { buffer, fileName, mimeType, fileSize: fileSize ?? buffer.length, fileUrl };
}

async function persistToDatabase(
  invoiceId: string,
  parsed: ParsedRequest,
  result: Awaited<ReturnType<typeof runAnalyzePipeline>>
) {
  const { db } = await import("@/lib/db");
  const { zatca, finalVision, finalForensics, finalMarket } = result;
  const fileUrl = parsed.fileUrl ?? `inline://${parsed.fileName}`;
  const summary = buildAnalyzeResponse(invoiceId, fileUrl, result).summary;

  const fileType = parsed.mimeType.includes("pdf") ? "pdf"
    : parsed.mimeType.includes("xml") || parsed.mimeType.includes("plain") ? "xml"
    : "image";

  await db.$transaction([
    db.invoice.create({
      data: {
        id:        invoiceId,
        fileName:  parsed.fileName,
        fileType,
        fileSize:  parsed.fileSize,
        mimeType:  parsed.mimeType,
        fileUrl,
        rawText:   zatca.rawText.slice(0, 50000) || null,
        rawXml:    zatca.rawXml?.slice(0, 100000) ?? null,
        qrBase64:  zatca.qrBase64,
        sellerName: zatca.qrData?.sellerName,
        vatNumber:  zatca.qrData?.vatNumber,
        invoiceDate: zatca.qrData?.timestamp,
        totalAmount: zatca.qrData?.totalWithVat,
        vatAmount:   zatca.qrData?.vatTotal,
        xmlHash:     zatca.qrData?.xmlHash,
        ecdsaSig:    zatca.qrData?.ecdsaSignature,
        publicKey:   zatca.qrData?.publicKey,
        zatcaStamp:  zatca.qrData?.zatcaCaStamp,
        riskScore:   result.consolidatedScore,
        riskLevel:   result.consolidatedLevel,
        status:      result.finalStatus,
      },
    }),
    db.invoiceAnalysis.create({
      data: {
        invoiceId,
        qrFound:              zatca.report.checks.qrFound,
        vatNumberValid:       zatca.report.checks.vatNumberValid,
        dateValid:            zatca.report.checks.dateValid,
        hashPresent:          zatca.report.checks.hashPresent,
        sigPresent:           zatca.report.checks.sigPresent,
        vatCalcValid:         zatca.report.checks.vatCalcValid,
        totalCalcValid:       zatca.report.checks.totalCalcValid,
        hashChainValid:       zatca.report.checks.hashChainValid,
        visionAgentResult:    JSON.stringify(finalVision),
        forensicsAgentResult: JSON.stringify(finalForensics),
        marketAgentResult:    JSON.stringify(finalMarket),
        explanation:   summary.en,
        explanationAr: summary.ar,
      },
    }),
    db.fraudFlag.createMany({
      data: [
        ...zatca.report.flags.map((f) => ({ invoiceId, ruleCode: f.ruleCode, severity: f.severity, messageEn: f.messageEn, messageAr: f.messageAr, source: "ZATCA" })),
        ...finalVision.findings.map((f) => ({ invoiceId, ruleCode: f.code, severity: f.severity, messageEn: f.messageEn, messageAr: f.messageAr, source: "VISION" })),
        ...finalForensics.findings.map((f) => ({ invoiceId, ruleCode: f.code, severity: f.severity, messageEn: f.messageEn, messageAr: f.messageAr, source: "FORENSICS" })),
        ...finalMarket.findings.map((f) => ({ invoiceId, ruleCode: f.code, severity: f.severity, messageEn: f.messageEn, messageAr: f.messageAr, source: "MARKET" })),
      ],
    }),
  ]);
}

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req);
  if (parsed instanceof NextResponse) return parsed;

  const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileUrl   = parsed.fileUrl ?? `inline://${parsed.fileName}`;

  try {
    const result = await runAnalyzePipeline({
      invoiceId,
      buffer:   parsed.buffer,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      fileUrl,
    });

    if (isDatabaseEnabled()) {
      try {
        await persistToDatabase(invoiceId, parsed, result);
      } catch (dbErr) {
        console.warn("[/api/analyze] DB persist skipped:", dbErr);
      }
    }

    return NextResponse.json(buildAnalyzeResponse(invoiceId, fileUrl, result));

  } catch (err) {
    console.error("[/api/analyze]", err);
    const message = err instanceof Error ? err.message : "Pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * ZATCA QR Code Extractor
 *
 * Supports three extraction strategies (tried in order):
 *  1. XML strategy  — parse UBL XML and find AdditionalDocumentReference[ID='QR']
 *  2. Text strategy — regex-scan extracted text for Base64 blocks ≥ 50 chars
 *  3. Image strategy — use sharp (resize/greyscale) + jsqr (decode pixels)
 *
 * Returns the raw Base64 QR payload ready for the TLV decoder.
 */

// ── XML ─────────────────────────────────────────────────────────────────────

/** Extract QR Base64 from a UBL XML string */
export function extractQRFromXML(xml: string): string | null {
  // ZATCA UBL path:
  // <cac:AdditionalDocumentReference>
  //   <cbc:ID>QR</cbc:ID>
  //   <cac:Attachment>
  //     <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">BASE64</cbc:EmbeddedDocumentBinaryObject>
  //   </cac:Attachment>
  // </cac:AdditionalDocumentReference>

  // Strategy A: look for EmbeddedDocumentBinaryObject near a QR id
  const qrBlockRegex =
    /<cac:AdditionalDocumentReference[\s\S]*?<cbc:ID[^>]*>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([A-Za-z0-9+/=\s]+)<\/cbc:EmbeddedDocumentBinaryObject>/i;

  const matchA = xml.match(qrBlockRegex);
  if (matchA) return matchA[1].replace(/\s/g, "");

  // Strategy B: generic EmbeddedDocumentBinaryObject (for non-standard formatting)
  const genericRegex =
    /<cbc:EmbeddedDocumentBinaryObject[^>]*>([A-Za-z0-9+/=\s]{50,})<\/cbc:EmbeddedDocumentBinaryObject>/gi;

  const matchB = genericRegex.exec(xml);
  if (matchB) return matchB[1].replace(/\s/g, "");

  return null;
}

// ── Text (PDF extracted) ─────────────────────────────────────────────────────

/**
 * Scan raw text extracted from a PDF for embedded Base64 QR payloads.
 * ZATCA QR codes are typically ≥ 50 Base64 chars and end with '='.
 */
export function extractQRFromText(text: string): string | null {
  // Look for large Base64-like blocks
  const base64Regex = /([A-Za-z0-9+/]{50,}={0,2})/g;
  const candidates: string[] = [];

  let m: RegExpExecArray | null;
  while ((m = base64Regex.exec(text)) !== null) {
    candidates.push(m[1]);
  }

  // Prefer longer candidates (richer QR payloads have more tags)
  candidates.sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    if (looksLikeZATCATLV(candidate)) return candidate;
  }

  // Fallback: return longest Base64 block found
  return candidates[0] ?? null;
}

/** Quick heuristic: decode first few bytes and check for tag 1 (0x01) */
function looksLikeZATCATLV(base64: string): boolean {
  try {
    const buf = Buffer.from(base64, "base64");
    // First byte should be tag 0x01 (Seller Name)
    // Second byte should be reasonable string length (1–200)
    return buf.length > 10 && buf[0] === 1 && buf[1] > 0 && buf[1] < 200;
  } catch {
    return false;
  }
}

// ── Image (jsqr + sharp) ─────────────────────────────────────────────────────

/**
 * Extract QR code from an image buffer using jsqr.
 * Uses sharp to normalise the image to RGBA pixels first.
 */
export async function extractQRFromImage(
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    // Dynamically import to avoid SSR issues
    const sharp = (await import("sharp")).default;
    const jsQR  = (await import("jsqr")).default;

    // Resize to max 1024px (jsqr performs better on smaller images)
    // Convert to raw RGBA pixels
    const { data, info } = await sharp(imageBuffer)
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(
      new Uint8ClampedArray(data),
      info.width,
      info.height
    );

    if (!code) return null;

    const qrText = code.data;

    // The QR value might already be the Base64 TLV, or it might be
    // wrapped in additional text — extract the Base64 portion
    const base64Match = qrText.match(/([A-Za-z0-9+/]{40,}={0,2})/);
    return base64Match ? base64Match[1] : qrText;
  } catch (err) {
    console.error("[QR extractor] Image decode failed:", err);
    return null;
  }
}

// ── PDF (pdf-parse) ──────────────────────────────────────────────────────────

export interface PDFExtractResult {
  text: string;
  xml: string | null;
  qrBase64: string | null;
  pageCount: number;
}

export async function extractFromPDF(
  pdfBuffer: Buffer
): Promise<PDFExtractResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed   = await pdfParse(pdfBuffer);

    const text: string = parsed.text ?? "";

    // Try to find embedded XML (PDF/A-3 with attached XML)
    const xmlMatch = text.match(/<\?xml[\s\S]*?<\/(?:Invoice|ubl:Invoice)>/i);
    const xml      = xmlMatch ? xmlMatch[0] : null;

    // Try QR extraction in priority order
    let qrBase64: string | null = null;

    if (xml) {
      qrBase64 = extractQRFromXML(xml);
    }
    if (!qrBase64) {
      qrBase64 = extractQRFromText(text);
    }

    return {
      text,
      xml,
      qrBase64,
      pageCount: parsed.numpages ?? 1,
    };
  } catch (err) {
    console.error("[PDF extractor] Failed:", err);
    return { text: "", xml: null, qrBase64: null, pageCount: 0 };
  }
}

// ── Unified entry point ───────────────────────────────────────────────────────

export type FileSource = "pdf" | "xml" | "image";

export interface ExtractResult {
  qrBase64: string | null;
  rawText:  string | null;
  rawXml:   string | null;
  source:   FileSource;
  strategy: "xml-tag" | "text-scan" | "image-decode" | "none";
}

export async function extractFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractResult> {
  const mime = mimeType.toLowerCase();

  // ── XML ────────────────────────────────────────────────
  if (mime.includes("xml") || mime.includes("text/plain")) {
    const xml      = buffer.toString("utf8");
    const qrBase64 = extractQRFromXML(xml);
    return {
      qrBase64,
      rawText: xml,
      rawXml:  xml,
      source:  "xml",
      strategy: qrBase64 ? "xml-tag" : "none",
    };
  }

  // ── PDF ────────────────────────────────────────────────
  if (mime.includes("pdf")) {
    const result = await extractFromPDF(buffer);
    const strategy =
      result.qrBase64
        ? result.xml
          ? "xml-tag"
          : "text-scan"
        : "none";
    return {
      qrBase64: result.qrBase64,
      rawText:  result.text,
      rawXml:   result.xml,
      source:   "pdf",
      strategy,
    };
  }

  // ── Image ──────────────────────────────────────────────
  if (mime.startsWith("image/")) {
    const qrBase64 = await extractQRFromImage(buffer);
    return {
      qrBase64,
      rawText:  null,
      rawXml:   null,
      source:   "image",
      strategy: qrBase64 ? "image-decode" : "none",
    };
  }

  return { qrBase64: null, rawText: null, rawXml: null, source: "pdf", strategy: "none" };
}

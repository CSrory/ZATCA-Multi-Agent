/**
 * ZATCA TLV (Tag-Length-Value) Decoder
 *
 * Based on ZATCA Security Features Implementation Standards v1.1
 * Section 4: QR Code Specifications
 *
 * Encoding rules (from the official document):
 *  • Tags 1–5 : 1-byte tag + 1-byte length + UTF-8 encoded string value
 *  • Tag 6    : 1-byte tag + 1-byte length (32) + raw SHA-256 bytes
 *  • Tags 7–9 : 1-byte tag + 1-byte length + raw binary bytes
 *
 * TLV order of operations (per spec):
 *  1. Start with required values and an empty byte array
 *  2. Construct Tag | Length | Value tuple per field
 *  3. Encode the complete byte array as Base64
 *  4. Create QR image from the Base64 string
 */

export interface ZATCAQRData {
  /** Tag 1 — Seller's name (UTF-8) */
  sellerName?: string;
  /** Tag 2 — VAT registration number (15 digits, starts and ends with 3) */
  vatNumber?: string;
  /** Tag 3 — Invoice timestamp ISO 8601 (e.g. 2022-02-21T12:13:57Z) */
  timestamp?: string;
  /** Tag 4 — Invoice total with VAT (string decimal) */
  totalWithVat?: string;
  /** Tag 5 — VAT total (string decimal) */
  vatTotal?: string;
  /** Tag 6 — SHA-256 hash of the XML invoice (hex string, 64 chars) */
  xmlHash?: string;
  /** Tag 7 — ECDSA signature of the XML hash (base64) */
  ecdsaSignature?: string;
  /** Tag 8 — ECDSA public key extracted from signing private key (base64) */
  publicKey?: string;
  /** Tag 9 — ECDSA signature of the Cryptographic Stamp issued by ZATCA CA (simplified invoices only) */
  zatcaCaStamp?: string;
}

export interface TLVDecodeResult {
  success: boolean;
  data: ZATCAQRData;
  rawTags: Map<number, Buffer>;
  errors: string[];
}

/**
 * Decode a ZATCA QR code payload.
 * Accepts either a Base64 string or a raw Buffer.
 */
export function decodeTLV(input: string | Buffer): TLVDecodeResult {
  const errors: string[] = [];
  const rawTags = new Map<number, Buffer>();
  const data: ZATCAQRData = {};

  let buf: Buffer;

  try {
    buf = typeof input === "string"
      ? Buffer.from(input.trim(), "base64")
      : input;
  } catch {
    return {
      success: false,
      data,
      rawTags,
      errors: ["Failed to decode Base64 input"],
    };
  }

  let offset = 0;

  while (offset < buf.length) {
    // Guard: need at least 2 bytes (tag + length)
    if (offset + 2 > buf.length) {
      errors.push(`Incomplete TLV at offset ${offset}`);
      break;
    }

    const tag    = buf[offset];
    const length = buf[offset + 1];
    offset += 2;

    // Guard: value bytes available
    if (offset + length > buf.length) {
      errors.push(
        `Tag ${tag}: declared length ${length} exceeds buffer at offset ${offset}`
      );
      break;
    }

    const value = buf.slice(offset, offset + length);
    offset += length;

    rawTags.set(tag, value);

    switch (tag) {
      case 1:
        data.sellerName = value.toString("utf8");
        break;

      case 2:
        data.vatNumber = value.toString("utf8");
        break;

      case 3:
        data.timestamp = value.toString("utf8");
        break;

      case 4:
        data.totalWithVat = value.toString("utf8");
        break;

      case 5:
        data.vatTotal = value.toString("utf8");
        break;

      case 6:
        // Raw 32-byte SHA-256 hash → convert to hex string
        if (value.length !== 32) {
          errors.push(`Tag 6 (XML hash): expected 32 bytes, got ${value.length}`);
        }
        data.xmlHash = value.toString("hex");
        break;

      case 7:
        // ECDSA signature — binary → base64
        data.ecdsaSignature = value.toString("base64");
        break;

      case 8:
        // ECDSA public key — binary → base64
        data.publicKey = value.toString("base64");
        break;

      case 9:
        // ZATCA CA stamp (simplified invoices only) — binary → base64
        data.zatcaCaStamp = value.toString("base64");
        break;

      default:
        // Unknown / future tag — store in rawTags only
        errors.push(`Unknown tag ${tag} (length ${length}) — stored in rawTags`);
    }
  }

  return {
    success: errors.filter((e) => !e.startsWith("Unknown")).length === 0,
    data,
    rawTags,
    errors,
  };
}

/**
 * Re-encode a ZATCAQRData object back to Base64 TLV.
 * Useful for generating test QR codes.
 */
export function encodeTLV(data: ZATCAQRData): string {
  const chunks: Buffer[] = [];

  const addString = (tag: number, value: string | undefined) => {
    if (!value) return;
    const val = Buffer.from(value, "utf8");
    chunks.push(Buffer.from([tag, val.length]), val);
  };

  const addBytes = (tag: number, value: string | undefined, encoding: BufferEncoding) => {
    if (!value) return;
    const val = Buffer.from(value, encoding);
    chunks.push(Buffer.from([tag, val.length]), val);
  };

  addString(1, data.sellerName);
  addString(2, data.vatNumber);
  addString(3, data.timestamp);
  addString(4, data.totalWithVat);
  addString(5, data.vatTotal);
  addBytes(6, data.xmlHash, "hex");
  addBytes(7, data.ecdsaSignature, "base64");
  addBytes(8, data.publicKey, "base64");
  addBytes(9, data.zatcaCaStamp, "base64");

  return Buffer.concat(chunks).toString("base64");
}

/**
 * Quick check: does a string look like a valid ZATCA QR Base64 payload?
 * Tries to decode and checks for at least Tag 1 + Tag 2.
 */
export function isValidZATCAQR(base64: string): boolean {
  try {
    const result = decodeTLV(base64);
    return result.success && !!result.data.sellerName && !!result.data.vatNumber;
  } catch {
    return false;
  }
}

/**
 * Bidiqqah Fraud Detection Rules Engine
 *
 * Rules are derived directly from:
 *  - ZATCA XML Implementation Standard v1.2 — Business Rules BR-KSA
 *  - ZATCA Security Features Standard v1.1 — Cryptographic requirements
 *
 * Each rule returns a RuleResult with a weight (0–100).
 * The overall riskScore = weighted average of all FAILed rules.
 */

import type { ZatcaQrFields, RuleResult, AnalysisReport } from "./types";
import { validateVATNumber, validateISO8601 } from "./validator";

// Local helpers ──────────────────────────────────────────────────────────────

function validateVatNumber(vat?: string): { valid: boolean; reason?: string } {
  if (!vat) return { valid: false, reason: "missing" };
  if (validateVATNumber(vat)) return { valid: true };
  if (!/^\d{15}$/.test(vat)) return { valid: false, reason: "must be exactly 15 digits" };
  if (vat[0] !== "3") return { valid: false, reason: "must start with 3" };
  if (vat[14] !== "3") return { valid: false, reason: "must end with 3" };
  return { valid: false, reason: "invalid format" };
}

function validateTimestamp(ts?: string): { valid: boolean; reason?: string } {
  if (!ts) return { valid: false, reason: "missing" };
  if (!validateISO8601(ts)) return { valid: false, reason: "not valid ISO 8601" };
  const d = new Date(ts);
  const phase1 = new Date("2021-12-04");
  if (d < phase1) return { valid: false, reason: "before ZATCA Phase 1 launch (2021-12-04)" };
  if (d > new Date()) return { valid: false, reason: "future-dated invoice" };
  return { valid: true };
}

function validateVatCalculation(
  total?: string,
  vat?: string
): { valid: boolean; reason?: string; expected?: string } {
  const t = parseFloat(total ?? "");
  const v = parseFloat(vat ?? "");
  if (isNaN(t) || isNaN(v)) return { valid: false, reason: "non-numeric amounts" };
  if (t <= 0) return { valid: false, reason: "total must be positive" };
  const expectedVat = parseFloat(((t / 1.15) * 0.15).toFixed(2));
  const diff = Math.abs(v - expectedVat);
  if (diff > 0.02) {
    return {
      valid: false,
      reason: `declared ${v}, expected ~${expectedVat} (diff: ${diff.toFixed(2)} SAR)`,
      expected: String(expectedVat),
    };
  }
  return { valid: true, expected: String(expectedVat) };
}

// ─── Run all rules ─────────────────────────────────────────────────────────

export function runFraudRules(
  fields: ZatcaQrFields,
  qrFound: boolean
): AnalysisReport {
  const start = Date.now();
  const rules: RuleResult[] = [];

  // ── Rule 0: QR code presence ──────────────────────────────────────────
  rules.push({
    ruleId: "BIDI-01",
    ruleName: "QR Code Presence",
    ruleNameAr: "وجود رمز QR",
    status: qrFound ? "PASS" : "FAIL",
    weight: 25,
    message: qrFound
      ? "ZATCA QR code found and decoded"
      : "No ZATCA QR code could be extracted from this document",
    messageAr: qrFound
      ? "تم العثور على رمز QR الخاص بهيئة الزكاة وفك تشفيره"
      : "لم يتم العثور على رمز QR المطلوب من هيئة الزكاة والضريبة",
  });

  if (!qrFound) {
    return buildReport(rules, fields, qrFound, Date.now() - start);
  }

  // ── Rule 1: VAT Number format (BR-KSA-08) ─────────────────────────────
  const vatCheck = validateVatNumber(fields.vatNumber);
  rules.push({
    ruleId: "BR-KSA-08",
    ruleName: "VAT Number Format",
    ruleNameAr: "صحة رقم التسجيل الضريبي",
    status: vatCheck.valid ? "PASS" : "FAIL",
    weight: 20,
    message: vatCheck.valid
      ? `VAT number ${fields.vatNumber} is valid`
      : `Invalid VAT number: ${vatCheck.reason}`,
    messageAr: vatCheck.valid
      ? `رقم الضريبة ${fields.vatNumber} صحيح`
      : `رقم ضريبي غير صحيح: ${vatCheck.reason}`,
    actual: fields.vatNumber,
    expected: "15 digits starting and ending with 3",
  });

  // ── Rule 2: Timestamp validity (BR-KSA-25) ────────────────────────────
  const tsCheck = validateTimestamp(fields.timestamp);
  rules.push({
    ruleId: "BR-KSA-25",
    ruleName: "Invoice Timestamp",
    ruleNameAr: "صحة تاريخ الفاتورة",
    status: tsCheck.valid ? "PASS" : "FAIL",
    weight: 15,
    message: tsCheck.valid
      ? `Timestamp ${fields.timestamp} is valid`
      : `Timestamp issue: ${tsCheck.reason}`,
    messageAr: tsCheck.valid
      ? `تاريخ الفاتورة ${fields.timestamp} صحيح`
      : `مشكلة في التاريخ: ${tsCheck.reason}`,
    actual: fields.timestamp,
    expected: "ISO 8601 format, after 2021-12-04",
  });

  // ── Rule 3: VAT Calculation (BR-KSA — 15% rate) ───────────────────────
  const vatCalc = validateVatCalculation(fields.totalWithVat, fields.vatAmount);
  rules.push({
    ruleId: "BR-KSA-VAT-CALC",
    ruleName: "VAT Calculation (15%)",
    ruleNameAr: "صحة حساب ضريبة القيمة المضافة (15%)",
    status: vatCalc.valid ? "PASS" : "FAIL",
    weight: 20,
    message: vatCalc.valid
      ? `VAT ${fields.vatAmount} SAR is correct for total ${fields.totalWithVat} SAR`
      : `VAT mismatch: ${vatCalc.reason}`,
    messageAr: vatCalc.valid
      ? `ضريبة القيمة المضافة ${fields.vatAmount} ريال صحيحة للمجموع ${fields.totalWithVat} ريال`
      : `خطأ في الضريبة: ${vatCalc.reason}`,
    actual:   fields.vatAmount,
    expected: vatCalc.expected,
  });

  // ── Rule 4: Seller name presence ─────────────────────────────────────
  rules.push({
    ruleId: "BR-KSA-04",
    ruleName: "Seller Name Present",
    ruleNameAr: "وجود اسم البائع",
    status: fields.sellerName ? "PASS" : "FAIL",
    weight: 10,
    message: fields.sellerName
      ? `Seller: "${fields.sellerName}"`
      : "Seller name is missing from QR code",
    messageAr: fields.sellerName
      ? `البائع: "${fields.sellerName}"`
      : "اسم البائع غير موجود في رمز QR",
    actual: fields.sellerName,
  });

  // ── Rule 5: Invoice hash presence (required from Jan 2023) ───────────
  rules.push({
    ruleId: "BR-KSA-HASH",
    ruleName: "Invoice Hash (Tag 6)",
    ruleNameAr: "هاش الفاتورة (العلامة 6)",
    status: fields.invoiceHash ? "PASS" : "WARN",
    weight: 8,
    message: fields.invoiceHash
      ? "Invoice hash (SHA-256) present"
      : "Invoice hash missing — required for invoices from Jan 2023",
    messageAr: fields.invoiceHash
      ? "هاش الفاتورة (SHA-256) موجود"
      : "هاش الفاتورة غير موجود — مطلوب للفواتير بعد يناير 2023",
    actual: fields.invoiceHash ? `${fields.invoiceHash.substring(0, 20)}...` : undefined,
  });

  // ── Rule 6: ECDSA Signature presence ─────────────────────────────────
  rules.push({
    ruleId: "BR-KSA-SIG",
    ruleName: "ECDSA Signature (Tag 7)",
    ruleNameAr: "التوقيع الرقمي ECDSA (العلامة 7)",
    status: fields.ecdsaSignature ? "PASS" : "WARN",
    weight: 8,
    message: fields.ecdsaSignature
      ? "ECDSA signature present"
      : "ECDSA signature missing — required for full compliance",
    messageAr: fields.ecdsaSignature
      ? "التوقيع الرقمي موجود"
      : "التوقيع الرقمي غير موجود — مطلوب للامتثال الكامل",
  });

  // ── Rule 7: Total amount sanity ───────────────────────────────────────
  const total = parseFloat(fields.totalWithVat ?? "0");
  const tooHighThreshold = 10_000_000; // 10M SAR — flag for manual review
  rules.push({
    ruleId: "BIDI-AMOUNT",
    ruleName: "Amount Sanity Check",
    ruleNameAr: "فحص معقولية المبلغ",
    status: total > 0 && total < tooHighThreshold ? "PASS" : total <= 0 ? "FAIL" : "WARN",
    weight: 5,
    message:
      total <= 0
        ? `Total amount ${total} is not positive`
        : total >= tooHighThreshold
        ? `Very high amount: ${total.toLocaleString()} SAR — flag for manual review`
        : `Amount ${total.toLocaleString()} SAR within normal range`,
    messageAr:
      total <= 0
        ? `المبلغ الإجمالي ${total} غير إيجابي`
        : total >= tooHighThreshold
        ? `مبلغ مرتفع جداً: ${total.toLocaleString()} ريال — يستوجب مراجعة يدوية`
        : `المبلغ ${total.toLocaleString()} ريال ضمن النطاق الطبيعي`,
    actual: fields.totalWithVat,
  });

  // ── Rule 8: VAT Number checksum (digit pattern) ───────────────────────
  if (fields.vatNumber && fields.vatNumber.length === 15) {
    const digits = fields.vatNumber.split("").map(Number);
    // Luhn-style: alternating digit sum check (heuristic for ZATCA numbers)
    const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 2 > 9 ? d * 2 - 9 : d * 2), 0);
    const checksumPass = sum % 10 === 0;
    rules.push({
      ruleId: "BIDI-VAT-CHK",
      ruleName: "VAT Number Pattern Check",
      ruleNameAr: "فحص نمط الرقم الضريبي",
      status: checksumPass ? "PASS" : "WARN",
      weight: 5,
      message: checksumPass
        ? "VAT number digit pattern looks consistent"
        : "VAT number digit pattern appears unusual",
      messageAr: checksumPass
        ? "نمط الأرقام الضريبية يبدو سليماً"
        : "نمط الأرقام الضريبية يبدو غير معتاد",
      actual: fields.vatNumber,
    });
  }

  return buildReport(rules, fields, qrFound, Date.now() - start);
}

// ─── Build final report ────────────────────────────────────────────────────

function buildReport(
  rules: RuleResult[],
  fields: ZatcaQrFields,
  qrFound: boolean,
  processingMs: number
): AnalysisReport {
  // Score: sum of weights for FAIL rules
  const maxWeight = rules.reduce((s, r) => s + r.weight, 0);
  const failedWeight = rules
    .filter((r) => r.status === "FAIL")
    .reduce((s, r) => s + r.weight, 0);
  const warnWeight = rules
    .filter((r) => r.status === "WARN")
    .reduce((s, r) => s + r.weight * 0.4, 0);

  const riskScore = maxWeight > 0
    ? Math.min(100, Math.round(((failedWeight + warnWeight) / maxWeight) * 100))
    : 0;

  const verdict =
    riskScore >= 70  ? "FRAUD"      :
    riskScore >= 40  ? "SUSPICIOUS" :
    riskScore >= 10  ? "SUSPICIOUS" :
                       "CLEAN";

  const riskLevel =
    riskScore >= 70 ? "CRITICAL" :
    riskScore >= 50 ? "HIGH"     :
    riskScore >= 30 ? "MEDIUM"   :
    riskScore >= 10 ? "LOW"      :
                      "LOW";

  const passCount = rules.filter((r) => r.status === "PASS").length;
  const failCount = rules.filter((r) => r.status === "FAIL").length;
  const warnCount = rules.filter((r) => r.status === "WARN").length;

  const summary = `Risk score: ${riskScore}/100. ${passCount} checks passed, ${failCount} failed, ${warnCount} warnings.`;
  const summaryAr = `درجة المخاطرة: ${riskScore}/100. اجتاز ${passCount} فحصاً، أخفق ${failCount}، تحذيرات ${warnCount}.`;

  return {
    verdict,
    riskScore,
    riskLevel,
    rules,
    summary,
    summaryAr,
    qrFields: fields,
    qrFound,
    processingMs,
  };
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, Search, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle,
  RotateCcw, ChevronDown, ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

// ─── Types (matching /api/analyze response) ───────────────────────────────────

interface AgentSummary {
  status:     "PASS" | "SUSPICIOUS" | "CRITICAL" | "ERROR";
  confidence: number;
  model:      string;
  durationMs: number;
  findings:   { code: string; severity: string; messageEn: string; messageAr: string }[];
  summary:    { en: string; ar: string };
}

export interface AnalysisResponse {
  success:    boolean;
  invoiceId:  string;
  fileUrl:    string;
  status:     string;
  riskScore:  number;
  riskLevel:  string;
  pipelineMs: number;
  zatca: {
    qrStrategy: string;
    checks:     Record<string, boolean>;
    flags:      { ruleCode: string; severity: string; messageEn: string; messageAr: string }[];
    riskScore:  number;
    qrDecoded: {
      sellerName?:    string | null;
      vatNumber?:     string | null;
      timestamp?:     string | null;
      totalWithVat?:  string | null;
      vatTotal?:      string | null;
      hasHash:        boolean;
      hasSignature:   boolean;
      hasPublicKey:   boolean;
      hasZatcaStamp:  boolean;
    };
  };
  agents: {
    vision:    AgentSummary;
    forensics: AgentSummary;
    market:    AgentSummary;
  };
  summary: { en: string; ar: string };
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  CLEAN:      { bg: "#EAFAF1", border: "#1A7A4A", text: "#1A7A4A", label: { ar: "نظيفة",     en: "Clean"      } },
  SUSPICIOUS: { bg: "#FEF9EC", border: "#D4860B", text: "#D4860B", label: { ar: "مشبوهة",    en: "Suspicious" } },
  FRAUD:      { bg: "#FDEDEC", border: "#C0392B", text: "#C0392B", label: { ar: "احتيال",    en: "Fraud"      } },
  PENDING:    { bg: "#EDE0CC", border: "#8B5A35", text: "#8B5A35", label: { ar: "معلقة",     en: "Pending"    } },
};

const AGENT_META = {
  vision:    { icon: Eye,        labelEn: "Vision Agent",    labelAr: "وكيل الرؤية",          color: "#1A6B9A" },
  forensics: { icon: Search,     labelEn: "Forensics Agent", labelAr: "وكيل الأدلة الجنائية",  color: "#C0392B" },
  market:    { icon: TrendingUp, labelEn: "Market Agent",    labelAr: "وكيل السياق التجاري",   color: "#1A7A4A" },
};

const statusColor = (s: string) =>
  s === "PASS" ? "#1A7A4A" : s === "CRITICAL" ? "#C0392B" : "#D4860B";
const statusBg = (s: string) =>
  s === "PASS" ? "#EAFAF1" : s === "CRITICAL" ? "#FDEDEC" : "#FEF9EC";

// ─── Main component ───────────────────────────────────────────────────────────

interface AnalysisResultProps {
  result:    AnalysisResponse;
  fileName:  string;
  onReset:   () => void;
  className?: string;
}

export function AnalysisResult({ result, fileName, onReset, className }: AnalysisResultProps) {
  const { lang } = useLang();
  const [showZatca,    setShowZatca]    = useState(false);
  const [showQR,       setShowQR]       = useState(false);
  const [expandAgent,  setExpandAgent]  = useState<string | null>(null);

  const cfg    = RISK_CONFIG[result.status as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.PENDING;
  const isAr   = lang === "ar";

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ── Verdict banner ────────────────────────────────── */}
      <motion.div
        className="rounded-2xl border-2 p-5 text-center"
        style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          {result.status === "CLEAN" ? (
            <CheckCircle2 className="h-8 w-8" style={{ color: cfg.text }} />
          ) : result.status === "FRAUD" ? (
            <XCircle className="h-8 w-8" style={{ color: cfg.text }} />
          ) : (
            <AlertTriangle className="h-8 w-8" style={{ color: cfg.text }} />
          )}
          <span className="text-2xl font-extrabold" style={{ color: cfg.text }}>
            {cfg.label[isAr ? "ar" : "en"]}
          </span>
        </div>

        {/* Risk score ring */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <RiskRing score={result.riskScore} color={cfg.text} />
          <div className="text-start">
            <p className="text-xs text-[#8B5A35]">{isAr ? "درجة المخاطرة" : "Risk Score"}</p>
            <p className="text-3xl font-extrabold" style={{ color: cfg.text }}>
              {result.riskScore}<span className="text-base font-medium text-[#A67C52]">/100</span>
            </p>
            <p className="text-xs text-[#A67C52]">
              {isAr ? "المستوى: " : "Level: "}{result.riskLevel}
            </p>
          </div>
        </div>

        <p className="text-sm text-[#5C2E0E] leading-relaxed max-w-lg mx-auto">
          {isAr ? result.summary.ar : result.summary.en}
        </p>

        <p className="mt-2 text-[10px] text-[#A67C52] font-mono">
          {isAr ? "وقت المعالجة: " : "Pipeline: "}{result.pipelineMs}ms
          {" · "}{isAr ? "الملف: " : "File: "}{fileName}
          {" · "}{isAr ? "المعرّف: " : "ID: "}{result.invoiceId.slice(0, 8)}…
        </p>
      </motion.div>

      {/* ── 3 Agent cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["vision", "forensics", "market"] as const).map((key, i) => {
          const agent = result.agents[key];
          const meta  = AGENT_META[key];
          const isExpanded = expandAgent === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-xl border border-[#D9C5A8] bg-white overflow-hidden shadow-card"
            >
              <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#FAF5EE] transition-colors"
                onClick={() => setExpandAgent(isExpanded ? null : key)}
              >
                <div className="flex items-center gap-2">
                  <meta.icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                  <span className="text-[12px] font-bold text-[#3D1A08]">
                    {isAr ? meta.labelAr : meta.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: statusBg(agent.status), color: statusColor(agent.status) }}
                  >
                    {agent.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[#A67C52]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[#A67C52]" />
                  )}
                </div>
              </div>

              <div className="px-3 pb-2.5">
                <p className="text-[11px] text-[#8B5A35] leading-snug">
                  {isAr ? agent.summary.ar : agent.summary.en}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-[#EDE0CC] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width:      `${agent.confidence * 100}%`,
                        background: statusColor(agent.status),
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#A67C52]">
                    {Math.round(agent.confidence * 100)}%
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && agent.findings.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[#EDE0CC] px-3 py-2 space-y-1.5"
                  >
                    {agent.findings.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-1.5">
                        <span
                          className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full"
                          style={{ background: f.severity === "CRITICAL" ? "#C0392B" : f.severity === "WARNING" ? "#D4860B" : "#8B5A35" }}
                        />
                        <p className="text-[10.5px] text-[#5C2E0E]">
                          <span className="font-mono font-bold">[{f.code}]</span>{" "}
                          {isAr ? f.messageAr : f.messageEn}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── ZATCA details (collapsible) ───────────────────── */}
      <div className="rounded-xl border border-[#D9C5A8] bg-white shadow-card overflow-hidden">
        <button
          onClick={() => setShowZatca((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#FAF5EE] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#5C2E0E]" />
            <span className="text-[13px] font-bold text-[#3D1A08]">
              {isAr ? "تفاصيل هيئة الزكاة والضريبة والجمارك" : "ZATCA Validation Details"}
            </span>
            {result.zatca.flags.length > 0 && (
              <span className="rounded-full bg-[#FDEDEC] text-[#C0392B] border border-[#C0392B]/20 px-2 py-0.5 text-[10px] font-bold">
                {result.zatca.flags.length}
              </span>
            )}
          </div>
          {showZatca ? <ChevronUp className="h-4 w-4 text-[#A67C52]" /> : <ChevronDown className="h-4 w-4 text-[#A67C52]" />}
        </button>

        <AnimatePresence>
          {showZatca && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#EDE0CC] px-4 py-3 space-y-3">
                {/* Checks grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(result.zatca.checks).map(([key, val]) => (
                    <div key={key} className={cn(
                      "rounded-lg px-2 py-1.5 text-center border",
                      val ? "bg-[#EAFAF1] border-[#1A7A4A]/20" : "bg-[#FDEDEC] border-[#C0392B]/20"
                    )}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#5C2E0E]">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className={cn("text-[11px] font-bold mt-0.5", val ? "text-[#1A7A4A]" : "text-[#C0392B]")}>
                        {val ? "✓ Pass" : "✗ Fail"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Flags */}
                {result.zatca.flags.length > 0 && (
                  <div className="space-y-1.5">
                    {result.zatca.flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-[#FAF5EE] px-3 py-2">
                        <span className={cn(
                          "mt-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold font-mono",
                          f.severity === "CRITICAL" ? "bg-[#FDEDEC] text-[#C0392B]" :
                          f.severity === "WARNING"  ? "bg-[#FEF9EC] text-[#D4860B]" :
                          "bg-[#EDE0CC] text-[#5C2E0E]"
                        )}>
                          {f.ruleCode}
                        </span>
                        <p className="text-[11px] text-[#5C2E0E]">
                          {isAr ? f.messageAr : f.messageEn}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* QR fields toggle */}
                <button
                  onClick={() => setShowQR((v) => !v)}
                  className="text-[11px] font-semibold text-[#5C2E0E] hover:underline flex items-center gap-1"
                >
                  {isAr ? "بيانات رمز QR المفككة" : "Decoded QR Fields"}
                  {showQR ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-[#FAF5EE] border border-[#D9C5A8] px-3 py-2.5 font-mono text-[10.5px] space-y-1 text-[#5C2E0E]">
                        {Object.entries(result.zatca.qrDecoded).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2">
                            <span className="text-[#A67C52] shrink-0">Tag {tagNum(k)}:</span>
                            <span className={typeof v === "boolean" ? (v ? "text-[#1A7A4A]" : "text-[#C0392B]") : ""}>
                              {typeof v === "boolean" ? (v ? "✓ Present" : "✗ Absent") : (v ?? "—")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action buttons ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-[#D9C5A8] bg-white px-4 py-2 text-[13px] font-semibold text-[#5C2E0E] transition-all hover:bg-[#EDE0CC] hover:border-[#8B5A35]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isAr ? "تحليل فاتورة جديدة" : "Analyze new invoice"}
        </button>

        {result.fileUrl && !result.fileUrl.startsWith("local://") && (
          <a
            href={result.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A6B9A] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isAr ? "عرض الملف" : "View file"}
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Risk ring ────────────────────────────────────────────────────────────────

function RiskRing({ score, color }: { score: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <svg width="64" height="64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" stroke="#EDE0CC" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" strokeWidth="5"
        stroke={color} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tagNum(key: string): string {
  const map: Record<string, string> = {
    sellerName: "1", vatNumber: "2", timestamp: "3",
    totalWithVat: "4", vatTotal: "5",
    hasHash: "6", hasSignature: "7", hasPublicKey: "8", hasZatcaStamp: "9",
  };
  return map[key] ?? "?";
}

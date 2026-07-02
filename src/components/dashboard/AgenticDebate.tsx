"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, Search, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Agent definitions ────────────────────────────────────────────────────────

interface AgentDef {
  id:        "ZATCA" | "VISION" | "FORENSICS" | "MARKET";
  labelEn:   string;
  labelAr:   string;
  icon:      React.ElementType;
  color:     string;
  borderColor: string;
  bgColor:   string;
  logs:      string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "ZATCA",
    labelEn: "ZATCA Validator",
    labelAr: "محقق هيئة الزكاة",
    icon: Shield,
    color: "text-[#5C2E0E]",
    borderColor: "border-[#C4A882]",
    bgColor: "bg-[#FAF5EE]",
    logs: [
      "> Initializing ZATCA TLV decoder v1.1...",
      "> Extracting QR Base64 payload from invoice...",
      "> Decoding Tag 1: Seller Name ✓",
      "> Decoding Tag 2: VAT Number...",
      "> Validating BR-KSA-40: 15-digit format check...",
      "> Decoding Tag 3: Timestamp (ISO 8601)...",
      "> Decoding Tag 4: Total Amount (SAR)...",
      "> Running BR-CO-17: VAT category calculation...",
      "> Running BR-KSA-50: Invoice line VAT validation...",
      "> Running BR-KSA-61: Hash chain integrity check...",
      "> Checking ECDSA cryptographic stamp (Tag 7)...",
      "> ZATCA validation complete. Risk score computed.",
    ],
  },
  {
    id: "VISION",
    labelEn: "Vision Agent",
    labelAr: "وكيل الرؤية",
    icon: Eye,
    color: "text-[#1A6B9A]",
    borderColor: "border-[#1A6B9A]/40",
    bgColor: "bg-[#EBF5FB]",
    logs: [
      "> Connecting to GPT-4o Vision model...",
      "> Fetching invoice document from storage...",
      "> Analyzing printed seller name...",
      "> Comparing visual VAT number with QR Tag 2...",
      "> Cross-referencing invoice date fields...",
      "> Extracting visible line item totals...",
      "> Comparing visual amounts vs QR Tag 4 & 5...",
      "> Detecting any printed/QR discrepancies...",
      "> Vision analysis complete.",
    ],
  },
  {
    id: "FORENSICS",
    labelEn: "Forensics Agent",
    labelAr: "وكيل الأدلة الجنائية",
    icon: Search,
    color: "text-[#C0392B]",
    borderColor: "border-[#C0392B]/40",
    bgColor: "bg-[#FDEDEC]",
    logs: [
      "> Loading digital forensics engine...",
      "> Parsing PDF binary structure...",
      "> Reading CreationDate metadata...",
      "> Checking ModDate vs invoice date...",
      "> Scanning for editorial software signatures...",
      "> Analyzing EOF markers and byte offsets...",
      "> Checking for incremental PDF updates...",
      "> Inspecting embedded file attachments...",
      "> Forensic sweep complete.",
    ],
  },
  {
    id: "MARKET",
    labelEn: "Market Agent",
    labelAr: "وكيل السياق التجاري",
    icon: TrendingUp,
    color: "text-[#1A7A4A]",
    borderColor: "border-[#1A7A4A]/40",
    bgColor: "bg-[#EAFAF1]",
    logs: [
      "> Initializing market intelligence module...",
      "> Analyzing commercial pricing patterns...",
      "> Running Benford's Law first-digit analysis...",
      "> Evaluating VAT category consistency...",
      "> Checking for round-number inflation schemes...",
      "> Scanning high-risk commercial keywords...",
      "> Assessing invoice total plausibility...",
      "> Verifying VAT effective rate (≈15%)...",
      "> Market analysis complete.",
    ],
  },
];

// ─── Log line timing ──────────────────────────────────────────────────────────
const LOG_INTERVAL_MS  = 280;
const PANEL_STAGGER_MS = 350;

// ─── Component ────────────────────────────────────────────────────────────────

interface AgenticDebateProps {
  fileName: string;
  onComplete?: () => void;
  className?: string;
}

export function AgenticDebate({ fileName, onComplete, className }: AgenticDebateProps) {
  const { lang } = useLang();
  const [visibleLogs, setVisibleLogs] = useState<Record<string, number>>({
    ZATCA: 0, VISION: 0, FORENSICS: 0, MARKET: 0,
  });
  const [agentDone, setAgentDone] = useState<Record<string, boolean>>({
    ZATCA: false, VISION: false, FORENSICS: false, MARKET: false,
  });
  const doneRef = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setInterval>[] = [];

    AGENTS.forEach((agent, agentIdx) => {
      let logIdx = 0;
      const timer = setInterval(() => {
        logIdx++;
        setVisibleLogs((prev) => ({ ...prev, [agent.id]: logIdx }));

        if (logIdx >= agent.logs.length) {
          clearInterval(timer);
          setAgentDone((prev) => {
            const next = { ...prev, [agent.id]: true };
            if (Object.values(next).every(Boolean) && !doneRef.current) {
              doneRef.current = true;
              setTimeout(() => onComplete?.(), 600);
            }
            return next;
          });
        }
      }, LOG_INTERVAL_MS + agentIdx * PANEL_STAGGER_MS);

      timers.push(timer);
    });

    return () => timers.forEach(clearInterval);
  }, [onComplete]);

  const totalLogs  = AGENTS.reduce((s, a) => s + a.logs.length, 0);
  const shownLogs  = Object.entries(visibleLogs).reduce(
    (s, [id, n]) => s + Math.min(n, AGENTS.find((a) => a.id === id)!.logs.length),
    0
  );
  const progress   = Math.round((shownLogs / totalLogs) * 100);
  const allDone    = Object.values(agentDone).every(Boolean);

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-[#3D1A08] text-lg">
            {lang === "ar" ? "النقاش متعدد الوكلاء" : "Agentic Debate"}
          </h3>
          <p className="text-xs text-[#8B5A35] truncate max-w-xs">
            {lang === "ar" ? "يُحلَّل: " : "Analyzing: "}{fileName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allDone ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-[#EAFAF1] border border-[#1A7A4A]/30 px-3 py-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#1A7A4A]" />
              <span className="text-[11px] font-bold text-[#1A7A4A]">
                {lang === "ar" ? "اكتمل" : "Complete"}
              </span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-[#EDE0CC] border border-[#C4A882] px-3 py-1">
              <Loader2 className="h-3.5 w-3.5 text-[#5C2E0E] animate-spin" />
              <span className="text-[11px] font-bold text-[#5C2E0E]">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────── */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDE0CC]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#5C2E0E] to-[#C4A882]"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── 4 Agent terminal panels ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AGENTS.map((agent, idx) => (
          <AgentPanel
            key={agent.id}
            agent={agent}
            visibleCount={visibleLogs[agent.id]}
            isDone={agentDone[agent.id]}
            staggerDelay={idx * 0.08}
            lang={lang}
          />
        ))}
      </div>

      {/* ── Final verdict preparing ──────────────────────────── */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[#5C2E0E]/30 bg-[#5C2E0E] px-4 py-3 text-center"
          >
            <p className="font-bold text-white text-sm">
              {lang === "ar"
                ? "⚖️ دمج نتائج الوكلاء... جارٍ إصدار الحكم النهائي"
                : "⚖️ Consolidating agent verdicts... Issuing final judgment"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Single agent terminal panel ─────────────────────────────────────────────

function AgentPanel({
  agent, visibleCount, isDone, staggerDelay, lang,
}: {
  agent:        AgentDef;
  visibleCount: number;
  isDone:       boolean;
  staggerDelay: number;
  lang:         string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shownLogs = agent.logs.slice(0, visibleCount);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.35, ease: "easeOut" }}
      className={cn(
        "rounded-xl border overflow-hidden",
        agent.borderColor,
        isDone ? "opacity-90" : "opacity-100"
      )}
    >
      {/* Panel header */}
      <div className={cn("flex items-center justify-between px-3 py-2", agent.bgColor)}>
        <div className="flex items-center gap-2">
          <agent.icon className={cn("h-3.5 w-3.5 shrink-0", agent.color)} />
          <span className={cn("text-[12px] font-bold", agent.color)}>
            {lang === "ar" ? agent.labelAr : agent.labelEn}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isDone ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-2 w-2 rounded-full bg-[#1A7A4A]"
            />
          ) : (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[#8B5A35]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="bg-[#1A1008] h-[130px] overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-relaxed scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        <AnimatePresence initial={false}>
          {shownLogs.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                line.includes("complete") || line.includes("✓")
                  ? "text-[#1A7A4A]"
                  : i === shownLogs.length - 1 && !isDone
                  ? "text-[#C4A882]"
                  : "text-[#A67C52]"
              )}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor */}
        {!isDone && (
          <motion.span
            className="inline-block h-3 w-1.5 bg-[#C4A882] ml-0.5"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

"use client";

import {
  AlertTriangle, CheckCircle, FileText,
  Clock, ShieldCheck, Activity, Zap, BookOpen,
} from "lucide-react";
import { Navbar }                   from "@/components/layout/Navbar";
import { DropZone }                 from "@/components/dashboard/DropZone";
import { StatCard, StatCardGrid }   from "@/components/dashboard/StatCard";
import { useLang }                  from "@/contexts/LanguageContext";
import { cn }                       from "@/lib/utils";

export default function DashboardPage() {
  const { t, lang } = useLang();

  /* ── Status pills ─────────────────────────────────────────── */
  const STATUS_PILLS = [
    { labelKey: "statusAiEngine"   as const, value: t("statusOnline"),  dot: "bg-[#1A7A4A] animate-pulse" },
    { labelKey: "statusDatabase"   as const, value: t("statusReady"),   dot: "bg-[#1A7A4A]" },
    { labelKey: "statusModels"     as const, value: "v2.4",             dot: "bg-[#C4A882]" },
    { labelKey: "statusConnection" as const, value: t("statusSecure"),  dot: "bg-[#1A6B9A]" },
  ];

  /* ── Activity items ───────────────────────────────────────── */
  const ACTIVITY_ITEMS = [
    {
      label:  t("activityInit"),
      time:   t("now"),
      status: t("activityDone"),
      dot:    "bg-[#1A7A4A]",
      badge:  "bg-[#EAFAF1] text-[#1A7A4A] border-[#1A7A4A]/20",
    },
    {
      label:  t("activityModel"),
      time:   t("now"),
      status: t("activityReady"),
      dot:    "bg-[#1A6B9A]",
      badge:  "bg-[#EBF5FB] text-[#1A6B9A] border-[#1A6B9A]/20",
    },
    {
      label:  t("activityWaiting"),
      time:   "—",
      status: t("activityIdle"),
      dot:    "bg-[#C4A882]",
      badge:  "bg-[#EDE0CC] text-[#8B5A35] border-[#C4A882]/30",
    },
  ];

  /* ── Info cards ───────────────────────────────────────────── */
  const INFO_CARDS = [
    {
      titleKey: "infoInstantTitle"  as const,
      descKey:  "infoInstantDesc"   as const,
      icon: Zap,
      iconBg: "bg-[#EDE0CC]", iconColor: "text-[#5C2E0E]",
    },
    {
      titleKey: "infoAccuracyTitle" as const,
      descKey:  "infoAccuracyDesc"  as const,
      icon: ShieldCheck,
      iconBg: "bg-[#EAFAF1]", iconColor: "text-[#1A7A4A]",
    },
    {
      titleKey: "infoReportsTitle"  as const,
      descKey:  "infoReportsDesc"   as const,
      icon: BookOpen,
      iconBg: "bg-[#EBF5FB]", iconColor: "text-[#1A6B9A]",
    },
  ];

  /* ── Footer status ────────────────────────────────────────── */
  const FOOTER_STATUS = [
    { labelKey: "statusAiEngine" as const, value: t("statusOnline"),  dot: "bg-[#1A7A4A] animate-pulse" },
    { labelKey: "statusDatabase" as const, value: t("statusReady"),   dot: "bg-[#1A7A4A]" },
    { labelKey: "statusModels"   as const, value: "v2.4",             dot: "bg-[#1A6B9A]" },
    { labelKey: "apiStatus"      as const, value: t("statusHealthy"), dot: "bg-[#1A7A4A]" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF5EE]">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#5C2E0E] via-[#7D4424] to-[#5C2E0E] px-6 py-9 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 h-full w-64 bg-gradient-to-r from-[#C4A882]/15 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
              <ShieldCheck className="h-5 w-5 text-[#EDE0CC]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {t("heroTitle")}
            </h1>
          </div>
          <p className="text-sm text-[#D9C5A8] max-w-xl leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_PILLS.map((p) => (
              <div
                key={p.labelKey}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-sm"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
                <span className="text-[11px] font-semibold text-white/85">{t(p.labelKey)}</span>
                <span className="text-[11px] text-[#C4A882]">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <main className="px-4 py-8 sm:px-6 lg:px-10 animate-fade-in">

        {/* Stat cards */}
        <StatCardGrid className="mb-8">
          <StatCard title={t("statTotal")}  value="—" subtitle={t("statTotalSub")}  icon={FileText}      variant="default" badge={t("badgeAll")}         />
          <StatCard title={t("statFraud")}  value="—" subtitle={t("statFraudSub")}  icon={AlertTriangle} variant="danger"  badge={t("badgeHighRisk")}    />
          <StatCard title={t("statClean")}  value="—" subtitle={t("statCleanSub")}  icon={CheckCircle}   variant="success" badge={t("badgeVerified")}    />
          <StatCard title={t("statSpeed")}  value="—" subtitle={t("statSpeedSub")}  icon={Clock}         variant="info"    badge={t("badgePerformance")} />
        </StatCardGrid>

        {/* Two-column */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader icon={<Zap className="h-4 w-4 text-[#5C2E0E]" />} title={t("sectionAnalyzer")} subtitle={t("sectionAnalyzerSub")} />
            <DropZone className="mt-3" />
          </div>
          <div>
            <SectionHeader icon={<Activity className="h-4 w-4 text-[#5C2E0E]" />} title={t("sectionActivity")} subtitle={t("sectionActivitySub")} />
            <ActivityPanel items={ACTIVITY_ITEMS} emptyText={t("activityEmpty")} />
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {INFO_CARDS.map((card) => (
            <div
              key={card.titleKey}
              className="rounded-2xl border border-[#D9C5A8] bg-white p-5 shadow-card hover:shadow-alinma-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9C5A8]", card.iconBg)}>
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <h3 className="font-extrabold text-[#3D1A08] mb-1.5">{t(card.titleKey)}</h3>
              <p className="text-sm text-[#8B5A35] leading-relaxed">{t(card.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Footer status bar */}
        <div className="mt-8 rounded-2xl border border-[#D9C5A8] bg-white px-5 py-3 shadow-card flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {FOOTER_STATUS.map((s) => (
              <div key={s.labelKey} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                <span className="text-[11px] font-bold text-[#5C2E0E]">{t(s.labelKey)}</span>
                <span className="text-[11px] text-[#A67C52]">{s.value}</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-[#A67C52] font-mono tracking-wider">
            {t("footerVersion")} · {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
          </span>
        </div>
      </main>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({
  icon, title, subtitle,
}: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9C5A8] bg-[#EDE0CC] shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-[15px] font-extrabold text-[#3D1A08]">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#8B5A35]">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Activity panel ────────────────────────────────────────────────────────
function ActivityPanel({
  items, emptyText,
}: {
  items: { label: string; time: string; status: string; dot: string; badge: string }[];
  emptyText: string;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[#D9C5A8] bg-white shadow-card p-4 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-[#EDE0CC] bg-[#FAF5EE] p-3">
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.dot)} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#3D1A08]">{item.label}</p>
            <p className="text-[11px] text-[#A67C52]">{item.time}</p>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", item.badge)}>
            {item.status}
          </span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-2 py-5 text-center">
        <Activity className="h-8 w-8 text-[#C4A882]" />
        <p className="text-xs text-[#A67C52]">{emptyText}</p>
      </div>
    </div>
  );
}

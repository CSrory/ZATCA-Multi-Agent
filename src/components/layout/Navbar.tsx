"use client";

import Image from "next/image";
import { Bell, Settings, ChevronDown, Shield, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { LayoutDashboard, FileSearch, BarChart3, Database } from "lucide-react";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { t, lang, toggleLang } = useLang();

  const NAV_LINKS = [
    { key: "navDashboard" as const, href: "#", icon: LayoutDashboard, active: true  },
    { key: "navAnalyze"   as const, href: "#", icon: FileSearch,       active: false },
    { key: "navReports"   as const, href: "#", icon: BarChart3,        active: false },
    { key: "navRecords"   as const, href: "#", icon: Database,         active: false },
  ];

  return (
    <header className={cn("relative z-40 bg-white border-b border-[#D9C5A8]", className)}>
      {/* ── Gradient top strip ───────────────────────────────────── */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#5C2E0E] via-[#C4A882] to-[#5C2E0E]" />

      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">

        {/* ── Brand ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Logo — white bg to blend away black PNG background */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-[#D9C5A8] shadow-sm">
            <Image
              src="/logo.png"
              alt={t("brandName")}
              fill
              sizes="44px"
              className="object-contain p-0.5 logo-blend"
              priority
            />
          </div>

          {/* Name + tagline */}
          <div className="flex flex-col leading-none gap-0.5">
            <span className={cn(
              "font-extrabold text-[#3D1A08] tracking-tight",
              lang === "ar" ? "text-xl font-arabic" : "text-[17px] font-sans"
            )}>
              {t("brandName")}
            </span>
            <span className="text-[10px] font-semibold text-[#8B5A35] tracking-widest uppercase">
              {t("brandTagline")}
            </span>
          </div>

          <div className="mx-2 hidden h-8 w-px bg-[#D9C5A8] sm:block" />

          {/* Live dot */}
          <div className="hidden items-center gap-1.5 rounded-full border border-[#C4A882]/50 bg-[#FAF5EE] px-3 py-1 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A7A4A] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A7A4A]" />
            </span>
            <span className="text-[11px] font-semibold text-[#1A7A4A]">{t("live")}</span>
          </div>
        </div>

        {/* ── Nav links (center) ────────────────────────────────────── */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-200",
                link.active
                  ? "bg-[#5C2E0E] text-white shadow-sm"
                  : "text-[#6B3518] hover:bg-[#EDE0CC] hover:text-[#3D1A08]"
              )}
            >
              <link.icon className="h-3.5 w-3.5 shrink-0" />
              {t(link.key)}
            </a>
          ))}
        </nav>

        {/* ── Right actions ────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Security badge (desktop only) */}
          <div className="hidden items-center gap-1.5 rounded-full border border-[#C4A882]/60 bg-[#FAF5EE] px-3 py-1 md:flex">
            <Shield className="h-3 w-3 text-[#5C2E0E]" />
            <span className="text-[10px] font-bold text-[#5C2E0E] tracking-wider">{t("secure")}</span>
          </div>

          {/* ── Language toggle ───────────────────────────────────── */}
          <button
            onClick={toggleLang}
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold",
              "transition-all duration-200 hover:scale-105 active:scale-95",
              "border-[#5C2E0E]/30 bg-[#FAF5EE] text-[#5C2E0E]",
              "hover:bg-[#5C2E0E] hover:text-white hover:border-[#5C2E0E]"
            )}
          >
            <Languages className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {lang === "ar" ? "EN" : "عربي"}
            </span>
          </button>

          {/* Bell */}
          <button className="relative rounded-xl p-2 text-[#8B5A35] transition-colors hover:bg-[#EDE0CC] hover:text-[#3D1A08]">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C0392B] ring-1 ring-white" />
          </button>

          {/* Settings */}
          <button className="rounded-xl p-2 text-[#8B5A35] transition-colors hover:bg-[#EDE0CC] hover:text-[#3D1A08]">
            <Settings className="h-4 w-4" />
          </button>

          {/* User */}
          <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#D9C5A8] bg-[#FAF5EE] px-3 py-1.5 transition-all hover:border-[#8B5A35] hover:bg-[#EDE0CC]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5C2E0E] text-xs font-bold text-[#FAF5EE] ring-2 ring-[#C4A882]/40">
              {lang === "ar" ? "م" : "A"}
            </div>
            <span className="hidden text-[12px] font-semibold text-[#3D1A08] md:block">
              {t("admin")}
            </span>
            <ChevronDown className="h-3 w-3 text-[#8B5A35]" />
          </div>
        </div>
      </div>
    </header>
  );
}

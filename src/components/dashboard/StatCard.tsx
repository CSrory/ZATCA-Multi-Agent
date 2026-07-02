import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type StatCardVariant = "default" | "danger" | "warning" | "success" | "info";
export type TrendDirection  = "up" | "down" | "neutral";

export interface StatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: StatCardVariant;
  trend?: { direction: TrendDirection; value: string; label?: string };
  isLoading?: boolean;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

// ─── Variant config (Alinma palette) ──────────────────────────────────────

const V: Record<
  StatCardVariant,
  { top: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  default: {
    top:         "from-[#5C2E0E] via-[#C4A882] to-transparent",
    iconBg:      "bg-[#EDE0CC]",
    iconColor:   "text-[#5C2E0E]",
    badgeBg:     "bg-[#EDE0CC]",
    badgeText:   "text-[#5C2E0E]",
    badgeBorder: "border-[#C4A882]",
  },
  danger: {
    top:         "from-[#C0392B] to-transparent",
    iconBg:      "bg-[#FDEDEC]",
    iconColor:   "text-[#C0392B]",
    badgeBg:     "bg-[#FDEDEC]",
    badgeText:   "text-[#C0392B]",
    badgeBorder: "border-[#C0392B]/30",
  },
  warning: {
    top:         "from-[#D4860B] to-transparent",
    iconBg:      "bg-[#FEF9EC]",
    iconColor:   "text-[#D4860B]",
    badgeBg:     "bg-[#FEF9EC]",
    badgeText:   "text-[#D4860B]",
    badgeBorder: "border-[#D4860B]/30",
  },
  success: {
    top:         "from-[#1A7A4A] to-transparent",
    iconBg:      "bg-[#EAFAF1]",
    iconColor:   "text-[#1A7A4A]",
    badgeBg:     "bg-[#EAFAF1]",
    badgeText:   "text-[#1A7A4A]",
    badgeBorder: "border-[#1A7A4A]/30",
  },
  info: {
    top:         "from-[#1A6B9A] to-transparent",
    iconBg:      "bg-[#EBF5FB]",
    iconColor:   "text-[#1A6B9A]",
    badgeBg:     "bg-[#EBF5FB]",
    badgeText:   "text-[#1A6B9A]",
    badgeBorder: "border-[#1A6B9A]/30",
  },
};

const TREND_CONFIG: Record<TrendDirection, { icon: LucideIcon; color: string }> = {
  up:      { icon: TrendingUp,   color: "text-[#C0392B]" },
  down:    { icon: TrendingDown, color: "text-[#1A7A4A]" },
  neutral: { icon: Minus,        color: "text-[#A67C52]" },
};

// ─── StatCard ──────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
  isLoading = false,
  badge,
  className,
  children,
}: StatCardProps) {
  const cfg = V[variant];
  const TrendIcon = trend ? TREND_CONFIG[trend.direction].icon : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-[#D9C5A8]",
        "shadow-card transition-all duration-200 hover:shadow-alinma-md hover:-translate-y-0.5",
        className
      )}
    >
      {/* Top color accent line */}
      <div className={cn("h-1 w-full bg-gradient-to-r", cfg.top)} />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold tracking-widest text-[#8B5A35] uppercase">
              {title}
            </p>
            {badge && (
              <span
                className={cn(
                  "mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  cfg.badgeBg, cfg.badgeText, cfg.badgeBorder
                )}
              >
                {badge}
              </span>
            )}
          </div>

          {Icon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9C5A8]", cfg.iconBg)}>
              <Icon className={cn("h-5 w-5", cfg.iconColor)} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-8 w-28 animate-pulse rounded-lg bg-[#EDE0CC]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#FAF5EE]" />
            </div>
          ) : value !== undefined ? (
            <>
              <p className="text-3xl font-bold tracking-tight text-[#3D1A08]"
                 style={{ fontFamily: "Tajawal, sans-serif" }}>
                {value}
              </p>
              {subtitle && (
                <p className="mt-0.5 text-xs text-[#A67C52]">{subtitle}</p>
              )}
            </>
          ) : (
            <div className="min-h-[3rem]">{children}</div>
          )}
        </div>

        {/* Trend */}
        {trend && TrendIcon && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#EDE0CC] pt-3">
            <TrendIcon className={cn("h-3.5 w-3.5", TREND_CONFIG[trend.direction].color)} />
            <span className={cn("text-xs font-bold", TREND_CONFIG[trend.direction].color)}>
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-xs text-[#A67C52]">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StatCard Grid ─────────────────────────────────────────────────────────

export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

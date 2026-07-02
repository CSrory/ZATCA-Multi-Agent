export type Lang = "ar" | "en";

export const t = {
  // ── Metadata ─────────────────────────────────────────────────
  siteTitle: {
    ar: "بدقة | نظام كشف الاحتيال في الفواتير",
    en: "Bidiqqah | Invoice Fraud Detection System",
  },
  siteDesc: {
    ar: "نظام ذكاء اصطناعي متقدم للكشف عن الاحتيال في فواتير الشركات",
    en: "Advanced AI-powered fraud detection system for corporate finance invoices",
  },

  // ── Navbar ───────────────────────────────────────────────────
  brandName: {
    ar: "بدقة",
    en: "Bidiqqah",
  },
  brandTagline: {
    ar: "كشف الاحتيال",
    en: "Fraud Detection",
  },
  live: {
    ar: "مباشر",
    en: "Live",
  },
  secure: {
    ar: "آمن ومشفّر",
    en: "Secure & Encrypted",
  },
  admin: {
    ar: "المشرف",
    en: "Admin",
  },
  navDashboard: {
    ar: "لوحة التحكم",
    en: "Dashboard",
  },
  navAnalyze: {
    ar: "تحليل الفواتير",
    en: "Analyze",
  },
  navReports: {
    ar: "التقارير",
    en: "Reports",
  },
  navRecords: {
    ar: "السجلات",
    en: "Records",
  },

  // ── Hero banner ──────────────────────────────────────────────
  heroTitle: {
    ar: "لوحة تحكم نظام بدقة",
    en: "Bidiqqah Control Panel",
  },
  heroSubtitle: {
    ar: "نظام كشف الاحتيال المدعوم بالذكاء الاصطناعي — ارفع فواتير الشركات لإجراء تقييم فوري للمخاطر",
    en: "AI-powered fraud detection — upload corporate invoices for instant risk assessment",
  },
  statusAiEngine: {
    ar: "محرك الذكاء الاصطناعي",
    en: "AI Engine",
  },
  statusDatabase: {
    ar: "قاعدة البيانات",
    en: "Database",
  },
  statusModels: {
    ar: "نماذج الاحتيال",
    en: "Fraud Models",
  },
  statusConnection: {
    ar: "الاتصال",
    en: "Connection",
  },
  statusOnline: {
    ar: "يعمل",
    en: "Online",
  },
  statusReady: {
    ar: "جاهزة",
    en: "Ready",
  },
  statusSecure: {
    ar: "آمن",
    en: "Secure",
  },
  statusHealthy: {
    ar: "سليمة",
    en: "Healthy",
  },

  // ── Stat Cards ───────────────────────────────────────────────
  statTotal: {
    ar: "إجمالي الفواتير المحللة",
    en: "Total Analyzed",
  },
  statTotalSub: {
    ar: "في انتظار الرفع",
    en: "Awaiting uploads",
  },
  statFraud: {
    ar: "حالات احتيال مكتشفة",
    en: "Fraud Detected",
  },
  statFraudSub: {
    ar: "لا توجد نتائج بعد",
    en: "No results yet",
  },
  statClean: {
    ar: "الفواتير النظيفة",
    en: "Clean Invoices",
  },
  statCleanSub: {
    ar: "لا توجد نتائج بعد",
    en: "No results yet",
  },
  statSpeed: {
    ar: "متوسط وقت الفحص",
    en: "Avg. Scan Time",
  },
  statSpeedSub: {
    ar: "لا توجد بيانات",
    en: "No data yet",
  },
  badgeAll: {
    ar: "الكل",
    en: "All Time",
  },
  badgeHighRisk: {
    ar: "خطر مرتفع",
    en: "High Risk",
  },
  badgeVerified: {
    ar: "موثّقة",
    en: "Verified",
  },
  badgePerformance: {
    ar: "الأداء",
    en: "Performance",
  },

  // ── Section headers ──────────────────────────────────────────
  sectionAnalyzer: {
    ar: "محلل الفواتير",
    en: "Invoice Analyzer",
  },
  sectionAnalyzerSub: {
    ar: "ارفع فاتورة أو أكثر لإجراء فحص الاحتيال بالذكاء الاصطناعي",
    en: "Upload one or more invoices for AI fraud screening",
  },
  sectionActivity: {
    ar: "آخر النشاطات",
    en: "Recent Activity",
  },
  sectionActivitySub: {
    ar: "أحدث أحداث الفحص",
    en: "Latest scan events",
  },

  // ── DropZone ─────────────────────────────────────────────────
  dropIdle: {
    ar: "أسقط الفواتير هنا",
    en: "Drop invoices here",
  },
  dropDragging: {
    ar: "أفلت الملف هنا...",
    en: "Release to analyze...",
  },
  dropUploading: {
    ar: "جاري تحليل المستندات...",
    en: "Scanning documents...",
  },
  dropSuccess: {
    ar: "اكتمل التحليل بنجاح ✓",
    en: "Analysis complete ✓",
  },
  dropSubIdle: {
    ar: "أو اضغط للتصفح — PDF، JPG، PNG، TIFF بحجم أقصى 25 ميغابايت",
    en: "or click to browse — PDF, JPG, PNG, TIFF up to 25 MB",
  },
  dropSubUploading: {
    ar: "يعمل نظام الذكاء الاصطناعي على فحص الوثائق",
    en: "AI fraud analysis in progress",
  },
  dropSubSuccess: {
    ar: "جميع الملفات تمت معالجتها — راجع النتائج أدناه",
    en: "All files processed — check results below",
  },
  dropSubDragging: {
    ar: "يدعم: PDF، JPG، PNG، TIFF",
    en: "Supported: PDF, JPG, PNG, TIFF",
  },
  fileQueue: {
    ar: "قائمة الملفات",
    en: "Documents Queue",
  },
  clearAll: {
    ar: "مسح الكل",
    en: "Clear all",
  },
  rejected: {
    ar: "ملف مرفوض",
    en: "file(s) rejected",
  },

  // ── Activity panel ───────────────────────────────────────────
  activityInit: {
    ar: "تهيئة النظام",
    en: "System initialized",
  },
  activityModel: {
    ar: "تحميل نموذج الذكاء الاصطناعي",
    en: "AI model loaded",
  },
  activityWaiting: {
    ar: "في انتظار أول رفع",
    en: "Awaiting first upload",
  },
  activityDone: {
    ar: "تمّ",
    en: "OK",
  },
  activityReady: {
    ar: "جاهز",
    en: "Ready",
  },
  activityIdle: {
    ar: "خامل",
    en: "Idle",
  },
  activityEmpty: {
    ar: "لا توجد نشاطات بعد — ارفع الفواتير للبدء",
    en: "No activity yet — upload invoices to begin",
  },
  now: {
    ar: "الآن",
    en: "Just now",
  },

  // ── Info cards ───────────────────────────────────────────────
  infoInstantTitle: {
    ar: "فحص فوري",
    en: "Instant Scan",
  },
  infoInstantDesc: {
    ar: "تحليل الفاتورة خلال ثوانٍ باستخدام نماذج الذكاء الاصطناعي المتخصصة في كشف الاحتيال المالي.",
    en: "Invoice analysis in seconds using AI models specialized in financial fraud detection.",
  },
  infoAccuracyTitle: {
    ar: "دقة عالية",
    en: "High Accuracy",
  },
  infoAccuracyDesc: {
    ar: "نسبة دقة تتجاوز 97% في اكتشاف الفواتير المزورة، استناداً إلى آلاف الحالات المدرّبة.",
    en: "Over 97% accuracy in detecting fraudulent invoices, trained on thousands of cases.",
  },
  infoReportsTitle: {
    ar: "تقارير مفصّلة",
    en: "Detailed Reports",
  },
  infoReportsDesc: {
    ar: "احصل على تقرير شامل لكل فاتورة يتضمن نقاط الخطر والتوصيات والأدلة الداعمة.",
    en: "Get a comprehensive report per invoice including risk scores, recommendations, and evidence.",
  },

  // ── Footer ───────────────────────────────────────────────────
  apiStatus: {
    ar: "واجهة API",
    en: "API",
  },
  footerVersion: {
    ar: "بدقة v1.0.0 · هاكاثون",
    en: "Bidiqqah v1.0.0 · Hackathon",
  },
} as const;

export type TranslationKey = keyof typeof t;

/** Returns the translated string for the given key and language */
export function tr(key: TranslationKey, lang: Lang): string {
  return t[key][lang];
}

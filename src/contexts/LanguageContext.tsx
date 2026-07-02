"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Lang, type TranslationKey, tr } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  toggleLang: () => {},
  t: (key) => tr(key, "ar"),
  isRtl: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [mounted, setMounted] = useState(false);

  /* Restore persisted language on mount */
  useEffect(() => {
    const stored = localStorage.getItem("bidiqqah-lang") as Lang | null;
    if (stored === "en" || stored === "ar") setLang(stored);
    setMounted(true);
  }, []);

  /* Sync <html> dir + lang attributes */
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, [lang, mounted]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "ar" ? "en" : "ar";
      localStorage.setItem("bidiqqah-lang", next);
      return next;
    });
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => tr(key, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, toggleLang, t: translate, isRtl: lang === "ar" }}
    >
      {/* Prevent flash of wrong language during hydration */}
      <div style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

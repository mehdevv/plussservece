import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { copy, type Copy, type Locale } from "./copy";

const STORAGE_KEY = "pluss-lang";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Copy;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "fr") return saved;
  } catch {
    /* ignore */
  }
  const nav = typeof navigator === "undefined" ? "" : navigator.language.toLowerCase();
  return nav.startsWith("ar") ? "ar" : "fr";
}

function applyDocument(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
  document.title = copy[locale].metaTitle;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", copy[locale].metaDescription);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (typeof window === "undefined" ? "fr" : readLocale()));

  useLayoutEffect(() => {
    applyDocument(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyDocument(next);
  };

  const value = useMemo(
    () => ({
      locale,
      dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
      t: copy[locale],
      setLocale,
    }),
    [locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

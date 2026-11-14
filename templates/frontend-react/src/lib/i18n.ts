import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "@/locales/en"
import zhCN from "@/locales/zh-CN"

export type Locale = "zh-CN" | "en"

export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en"]
export const LOCALE_STORAGE_KEY = "app.locale"

function readStoredLocale(): Locale {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "en"
      ? "en"
      : "zh-CN"
  } catch {
    return "zh-CN"
  }
}

function normalizeLocale(locale: string | undefined): Locale {
  return locale?.startsWith("en") ? "en" : "zh-CN"
}

function applyLocale(locale: string | undefined) {
  const normalized = normalizeLocale(locale)
  document.documentElement.lang = normalized
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
  } catch {
    // Private browsing may block localStorage; the in-memory language still works.
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    en: { translation: en },
  },
  lng: readStoredLocale(),
  fallbackLng: "zh-CN",
  supportedLngs: SUPPORTED_LOCALES,
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
})

applyLocale(i18n.resolvedLanguage)
i18n.on("languageChanged", applyLocale)

export function changeLocale(locale: Locale): Promise<unknown> {
  return i18n.changeLanguage(locale)
}

export function currentLocale(): Locale {
  return normalizeLocale(i18n.resolvedLanguage)
}

export default i18n

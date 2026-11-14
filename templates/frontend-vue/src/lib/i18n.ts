import { watch } from "vue"
import { createI18n } from "vue-i18n"

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

const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale(),
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN,
    en,
  },
  // Server-provided menu, role, and operation names intentionally fall back
  // to the backend value when no catalog entry exists.
  missingWarn: false,
  fallbackWarn: false,
})

applyLocale(i18n.global.locale.value)
watch(i18n.global.locale, applyLocale)

export function changeLocale(locale: Locale) {
  i18n.global.locale.value = locale
}

export function currentLocale(): Locale {
  return normalizeLocale(i18n.global.locale.value)
}

export default i18n

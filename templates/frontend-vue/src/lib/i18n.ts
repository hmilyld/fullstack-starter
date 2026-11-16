import { watch } from "vue"
import { createI18n } from "vue-i18n"

import en from "@/locales/en"
import zhCN from "@/locales/zh-CN"

export type Locale = "zh-CN" | "en"

export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en"]
export const LOCALE_STORAGE_KEY = "app.locale"
/** 用户主动切换语言的标记；旧版本每次启动都会写 app.locale，不能仅凭它判断用户选择。 */
export const LOCALE_PREFERENCE_KEY = "app.locale.explicit"

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!stored) return null
    return stored === "en" ? "en" : "zh-CN"
  } catch {
    return null
  }
}

function normalizeLocale(locale: string | undefined): Locale {
  return locale?.startsWith("en") ? "en" : "zh-CN"
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, "1")
  } catch {
    // Private browsing may block localStorage; the in-memory language still works.
  }
}

const i18n = createI18n({
  legacy: false,
  locale: readStoredLocale() ?? "zh-CN",
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

watch(i18n.global.locale, (locale) =>
  applyDocumentLocale(normalizeLocale(locale))
)
applyDocumentLocale(currentLocale())

export function changeLocale(locale: Locale) {
  persistLocale(locale)
  i18n.global.locale.value = locale
}

/** 用户是否手动选择过语言；未选择时才会采用站点默认语言。 */
export function hasLocalePreference(): boolean {
  try {
    if (window.localStorage.getItem(LOCALE_PREFERENCE_KEY) === "1") return true
    // 旧版本每次启动都会写入 app.locale：zh-CN 可能只是默认值，只有 en 一定来自用户切换。
    return readStoredLocale() === "en"
  } catch {
    return false
  }
}

/**
 * 应用站点默认语言，但不写入 localStorage。
 * 用户手动切换过语言时保持用户选择。
 */
export function applySiteDefaultLocale(
  locale: string | undefined
): Promise<void> {
  if (hasLocalePreference()) return Promise.resolve()
  const normalized = normalizeLocale(locale)
  if (normalized === currentLocale()) return Promise.resolve()
  i18n.global.locale.value = normalized
  return Promise.resolve()
}

export function currentLocale(): Locale {
  return normalizeLocale(i18n.global.locale.value)
}

export function translate(
  key: string,
  options: Record<string, unknown> = {}
): string {
  return i18n.global.t(key, options)
}

export default i18n

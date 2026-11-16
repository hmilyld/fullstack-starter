import i18n from "i18next"
import { derived, writable } from "svelte/store"

import en from "#lib/locales/en.js"
import zhCN from "#lib/locales/zh-CN.js"

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
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale
  }
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, "1")
  } catch {
    // 隐私模式可能禁止写入 localStorage，内存中的语言仍然有效
  }
}

void i18n.init({
  resources: {
    "zh-CN": { translation: zhCN },
    en: { translation: en },
  },
  lng: readStoredLocale() ?? "zh-CN",
  fallbackLng: "zh-CN",
  supportedLngs: SUPPORTED_LOCALES,
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
})

/** 当前语言；组件中使用 `$locale` 获取值 */
export const locale = writable<Locale>(normalizeLocale(i18n.resolvedLanguage))

applyDocumentLocale(normalizeLocale(i18n.resolvedLanguage))

/**
 * 响应式翻译函数，组件模板中使用 `$t("key")`。
 * 切换语言后所有订阅 `$t` 的组件会自动重新渲染。
 */
export const t = derived(locale, ($locale) => {
  const fixed = i18n.getFixedT($locale)
  return (key: string, options?: Record<string, unknown>) =>
    fixed(key, options) as string
})

/** 非组件环境（hooks、store、事件回调）使用的同步翻译 */
export function translate(
  key: string,
  options?: Record<string, unknown>
): string {
  return i18n.t(key, options) as string
}

async function setLocale(next: Locale, persist: boolean): Promise<void> {
  if (persist) persistLocale(next)
  await i18n.changeLanguage(next)
  const normalized = normalizeLocale(i18n.resolvedLanguage)
  locale.set(normalized)
  applyDocumentLocale(normalized)
}

export function changeLocale(next: Locale): Promise<void> {
  return setLocale(next, true)
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
  siteLocale: string | undefined
): Promise<void> {
  if (hasLocalePreference()) return Promise.resolve()
  const normalized = normalizeLocale(siteLocale)
  if (normalized === currentLocale()) return Promise.resolve()
  return setLocale(normalized, false)
}

export function currentLocale(): Locale {
  return normalizeLocale(i18n.resolvedLanguage)
}

export default i18n

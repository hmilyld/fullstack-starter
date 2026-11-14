import i18n from "i18next"
import { derived, writable } from "svelte/store"

import en from "#lib/locales/en.js"
import zhCN from "#lib/locales/zh-CN.js"

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
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalized
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
  } catch {
    // 隐私模式可能禁止写入 localStorage，内存中的语言仍然有效
  }
}

void i18n.init({
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

/** 当前语言；组件中使用 `$locale` 获取值 */
export const locale = writable<Locale>(normalizeLocale(i18n.resolvedLanguage))

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

export async function changeLocale(next: Locale): Promise<void> {
  await i18n.changeLanguage(next)
  const normalized = normalizeLocale(i18n.resolvedLanguage)
  locale.set(normalized)
  applyLocale(normalized)
}

export function currentLocale(): Locale {
  return normalizeLocale(i18n.resolvedLanguage)
}

export default i18n

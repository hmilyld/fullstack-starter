import { createI18n } from "vue-i18n"
import { describe, expect, it } from "vitest"

import en from "./en"
import zhCN from "./zh-CN"

function flatten(
  value: unknown,
  prefix = "",
  out: Record<string, string> = {}
) {
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object") flatten(child, path, out)
    else out[path] = String(child)
  }
  return out
}

/** 只用到同步翻译，收窄类型避免 vue-i18n 对完整目录做深层推导。 */
type SyncTranslator = { global: { t: (key: string) => string } }

const catalogs = [
  ["zh-CN", zhCN],
  ["en", en],
] as const

describe("locale catalogs", () => {
  it.each(catalogs)("compiles every %s message", (locale, messages) => {
    const i18n = createI18n({
      legacy: false,
      locale,
      fallbackLocale: locale,
      missingWarn: false,
      fallbackWarn: false,
      messages: { [locale]: messages },
    } as never) as unknown as SyncTranslator

    const failures: string[] = []
    for (const key of Object.keys(flatten(messages))) {
      try {
        i18n.global.t(key)
      } catch (error) {
        failures.push(`${key}: ${(error as Error).message.split("\n")[0]}`)
      }
    }

    expect(failures).toEqual([])
  })

  it.each(catalogs)("renders %s plain text unchanged", (locale, messages) => {
    const i18n = createI18n({
      legacy: false,
      locale,
      fallbackLocale: locale,
      missingWarn: false,
      fallbackWarn: false,
      messages: { [locale]: messages },
    } as never) as unknown as SyncTranslator

    const failures: string[] = []
    for (const [key, raw] of Object.entries(flatten(messages))) {
      if (/\{[A-Za-z0-9_]+\}/.test(raw)) continue
      // vue-i18n 的字面量转义 `{'x'}` 会还原成 `x`；其余字符必须原样输出。
      const expected = raw.replace(/\{'(.*?)'\}/g, "$1")
      const rendered = i18n.global.t(key)
      if (rendered !== expected) {
        failures.push(
          `${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(rendered)}`
        )
      }
    }

    expect(failures).toEqual([])
  })
})

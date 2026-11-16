import { afterEach, describe, expect, it } from "vitest"

import {
  applySiteDefaultLocale,
  changeLocale,
  currentLocale,
  hasLocalePreference,
  LOCALE_PREFERENCE_KEY,
  LOCALE_STORAGE_KEY,
  translate,
} from "./i18n"

describe("i18n", () => {
  afterEach(async () => {
    await changeLocale("zh-CN")
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
  })

  it("defaults to Chinese and switches to English", async () => {
    expect(currentLocale()).toBe("zh-CN")
    expect(translate("auth.login.title")).toBe("欢迎回来")

    await changeLocale("en")

    expect(currentLocale()).toBe("en")
    expect(translate("auth.login.title")).toBe("Welcome back")
    expect(document.documentElement.lang).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en")
    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe("1")
  })

  it("uses the site default until the user chooses a language", async () => {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
    await applySiteDefaultLocale("en")

    expect(currentLocale()).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull()

    await changeLocale("zh-CN")
    await applySiteDefaultLocale("en")

    expect(currentLocale()).toBe("zh-CN")
  })

  it("treats the legacy zh-CN default as no preference but keeps a legacy en choice", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-CN")
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
    expect(hasLocalePreference()).toBe(false)

    await applySiteDefaultLocale("en")
    expect(currentLocale()).toBe("en")

    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en")
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
    expect(hasLocalePreference()).toBe(true)
  })

  it("keeps a marked explicit choice even when the site default differs", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-CN")
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, "1")

    await applySiteDefaultLocale("en")

    expect(currentLocale()).toBe("zh-CN")
  })

  it("falls back to Chinese for missing keys", () => {
    expect(translate("common.save")).toBe("保存")
    expect(translate("roles.admin")).toBe("管理员")
  })
})

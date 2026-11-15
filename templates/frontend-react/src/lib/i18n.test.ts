import { afterEach, describe, expect, it } from "vitest"

import i18n, { changeLocale, currentLocale, LOCALE_STORAGE_KEY } from "./i18n"

describe("i18n", () => {
  afterEach(async () => {
    await i18n.changeLanguage("zh-CN")
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
  })

  it("defaults to Chinese and switches to English", async () => {
    expect(currentLocale()).toBe("zh-CN")
    expect(i18n.t("auth.login.title")).toBe("欢迎回来")

    await changeLocale("en")

    expect(currentLocale()).toBe("en")
    expect(i18n.t("auth.login.title")).toBe("Welcome back")
    expect(document.documentElement.lang).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en")
  })
})

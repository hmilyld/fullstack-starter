import { describe, expect, it } from "vitest"

import {
  changeLocale,
  currentLocale,
  LOCALE_STORAGE_KEY,
  translate,
} from "./i18n"

describe("i18n", () => {
  it("defaults to Chinese and switches to English", async () => {
    expect(currentLocale()).toBe("zh-CN")
    expect(translate("auth.login.title")).toBe("欢迎回来")

    await changeLocale("en")

    expect(currentLocale()).toBe("en")
    expect(translate("auth.login.title")).toBe("Welcome back")
    expect(document.documentElement.lang).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en")
  })

  it("falls back to Chinese for missing keys", () => {
    expect(translate("common.save")).toBe("保存")
    expect(translate("roles.admin")).toBe("管理员")
  })
})

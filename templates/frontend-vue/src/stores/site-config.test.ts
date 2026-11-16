import { createPinia, setActivePinia } from "pinia"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  changeLocale,
  currentLocale,
  LOCALE_PREFERENCE_KEY,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n"
import { useSiteConfigStore } from "./site-config"

const getPublicConfig = vi.hoisted(() => vi.fn())

vi.mock("@/api/system", () => ({ getPublicConfig }))

describe("site config store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getPublicConfig.mockReset()
    getPublicConfig.mockResolvedValue({
      code: 0,
      message: "success",
      data: {
        siteName: "管理系统",
        siteDescription: "",
        maintenanceEnabled: false,
        maintenanceMessage: "",
        openRegistration: true,
        manualReview: false,
        defaultLocale: "en",
      },
    })
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
  })

  afterEach(() => {
    changeLocale("zh-CN")
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
  })

  it("applies the site default locale for users without a preference", async () => {
    const store = useSiteConfigStore()

    await store.fetchConfig()

    expect(currentLocale()).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBeNull()
  })
})

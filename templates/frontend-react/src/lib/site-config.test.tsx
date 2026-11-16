import { render, screen, waitFor } from "@testing-library/react"
import { useTranslation } from "react-i18next"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import i18n, {
  currentLocale,
  LOCALE_PREFERENCE_KEY,
  LOCALE_STORAGE_KEY,
} from "./i18n"
import { SiteConfigProvider } from "./site-config"

const getPublicConfig = vi.hoisted(() => vi.fn())

vi.mock("@/api/system", () => ({ getPublicConfig }))

function LocaleProbe() {
  useTranslation()
  return <span data-testid="locale">{currentLocale()}</span>
}

describe("SiteConfigProvider", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN")
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

  afterEach(async () => {
    await i18n.changeLanguage("zh-CN")
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
  })

  it("applies the site default locale for users without a preference", async () => {
    render(
      <SiteConfigProvider>
        <LocaleProbe />
      </SiteConfigProvider>
    )

    expect(await screen.findByTestId("locale")).toHaveTextContent("en")
    await waitFor(() => expect(currentLocale()).toBe("en"))
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBeNull()
  })
})

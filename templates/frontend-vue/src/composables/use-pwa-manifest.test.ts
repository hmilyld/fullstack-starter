import { effectScope, nextTick } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePwaManifest } from "./use-pwa-manifest"
import { useSiteConfigStore } from "@/stores/site-config"
import { useThemeStore } from "@/stores/theme"

describe("usePwaManifest", () => {
  const createObjectURL = vi.fn()
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    document.head.innerHTML = [
      '<link rel="manifest" href="/manifest.webmanifest" />',
      '<meta name="theme-color" content="#ffffff" />',
    ].join("")
    createObjectURL.mockReset()
    createObjectURL.mockReturnValue("blob:manifest")
    revokeObjectURL.mockReset()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    })
    setActivePinia(createPinia())
  })

  it("updates name, description and theme color when stores change", async () => {
    const siteConfig = useSiteConfigStore()
    const themeStore = useThemeStore()
    const scope = effectScope()

    scope.run(() => usePwaManifest())
    await nextTick()

    expect(
      document.querySelector<HTMLMetaElement>('meta[name="application-name"]')
        ?.content
    ).toBe("管理系统")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.content
    ).toBe("#ffffff")

    siteConfig.config = {
      siteName: "运营后台",
      siteDescription: "运营团队管理",
      maintenanceEnabled: false,
      maintenanceMessage: "",
      openRegistration: true,
      manualReview: false,
    }
    themeStore.setTheme("dark")
    await nextTick()

    expect(
      document.querySelector<HTMLMetaElement>('meta[name="application-name"]')
        ?.content
    ).toBe("运营后台")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.content
    ).toBe("#0a0a0a")
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href
    ).toContain("blob:")

    scope.stop()
  })
})

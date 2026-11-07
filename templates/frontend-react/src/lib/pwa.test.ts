import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PublicConfig } from "@/types/system"
import { applyPwaManifest, buildPwaManifest } from "./pwa"

const config: PublicConfig = {
  siteName: "运营后台",
  siteDescription: "面向运营团队的管理系统",
  maintenanceEnabled: false,
  maintenanceMessage: "",
  openRegistration: true,
  manualReview: false,
}

describe("buildPwaManifest", () => {
  it("uses fallbacks when site config is unavailable", () => {
    const manifest = buildPwaManifest(null, "light")

    expect(manifest.name).toBe("管理系统")
    expect(manifest.description).toContain("React")
    expect(manifest.theme_color).toBe("#ffffff")
    expect(manifest.background_color).toBe("#ffffff")
    expect(manifest.icons[0]?.src).toBe("/icons/icon.svg")
  })

  it("follows site name, description and theme", () => {
    const manifest = buildPwaManifest(config, "dark")

    expect(manifest.name).toBe("运营后台")
    expect(manifest.description).toBe("面向运营团队的管理系统")
    expect(manifest.theme_color).toBe("#0a0a0a")
    expect(manifest.background_color).toBe("#0a0a0a")
  })

  it("truncates short_name to 12 characters", () => {
    const manifest = buildPwaManifest(
      { ...config, siteName: "这是一个非常非常长的管理后台名称" },
      "light"
    )

    expect(manifest.short_name).toHaveLength(12)
    expect(manifest.name.length).toBeGreaterThan(12)
  })
})

describe("applyPwaManifest", () => {
  const createObjectURL = vi.fn()
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    document.head.innerHTML = [
      '<link rel="manifest" href="/manifest.webmanifest" />',
      '<meta name="theme-color" content="#000000" />',
    ].join("")

    createObjectURL.mockReset()
    createObjectURL
      .mockReturnValueOnce("blob:manifest-one")
      .mockReturnValueOnce("blob:manifest-two")
    revokeObjectURL.mockReset()

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    })
  })

  it("writes the manifest, theme color and app name to the document", () => {
    const url = applyPwaManifest(buildPwaManifest(config, "light"))

    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    expect(url).toBe("blob:manifest-one")
    expect(link?.href).toBe("blob:manifest-one")
    expect(link?.dataset.dynamicHref).toBe("blob:manifest-one")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.content
    ).toBe("#ffffff")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="application-name"]')
        ?.content
    ).toBe("运营后台")
    expect(
      document.querySelector<HTMLMetaElement>(
        'meta[name="apple-mobile-web-app-title"]'
      )?.content
    ).toBe("运营后台")
  })

  it("revokes the previous blob when the manifest is refreshed", () => {
    applyPwaManifest(buildPwaManifest(config, "light"))
    applyPwaManifest(buildPwaManifest(config, "dark"))

    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    expect(link?.href).toBe("blob:manifest-two")
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:manifest-one")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.content
    ).toBe("#0a0a0a")
  })
})

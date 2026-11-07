import { render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePwaManifest } from "./use-pwa-manifest"

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light" }),
}))

vi.mock("@/lib/site-config", () => ({
  useSiteConfig: () => ({
    config: {
      siteName: "运营后台",
      siteDescription: "面向运营团队的管理系统",
      maintenanceEnabled: false,
      maintenanceMessage: "",
      openRegistration: true,
      manualReview: false,
    },
  }),
}))

function Harness() {
  usePwaManifest()
  return null
}

describe("usePwaManifest", () => {
  const createObjectURL = vi.fn(() => "blob:hook-manifest")

  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />'
    createObjectURL.mockClear()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    })
  })

  it("writes a manifest derived from site config and theme", async () => {
    render(<Harness />)

    await waitFor(() => {
      const link = document.querySelector<HTMLLinkElement>(
        'link[rel="manifest"]'
      )
      expect(link?.href).toBe("blob:hook-manifest")
    })

    expect(
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.content
    ).toBe("#ffffff")
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="application-name"]')
        ?.content
    ).toBe("运营后台")
  })
})

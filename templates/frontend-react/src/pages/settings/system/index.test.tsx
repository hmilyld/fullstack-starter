import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import i18n from "@/lib/i18n"
import { SiteConfigProvider } from "@/lib/site-config"

import { SystemPage } from "./index"

const configData = {
  siteName: "原站点名称",
  siteDescription: "",
  keywords: "",
  maintenanceEnabled: false,
  maintenanceMessage: "",
  openRegistration: true,
  manualReview: false,
  defaultRoleId: "user",
  welcomeMessage: "",
  smtpEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  smtpFromName: "",
  smtpFromEmail: "",
  smtpUseSsl: true,
}

const getSystemConfig = vi.hoisted(() => vi.fn())

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    hasPermission: () => true,
    user: {
      id: "1",
      name: "管理员",
      email: "admin@example.com",
      role: "admin",
      permissions: [],
      avatar: "",
    },
  }),
}))

vi.mock("@/api/role", () => ({
  getRoles: vi.fn(async () => ({
    code: 0,
    message: "success",
    data: { list: [], total: 0, page: 1, pageSize: 100 },
  })),
}))

vi.mock("@/api/system", () => ({
  getSystemConfig,
  getPublicConfig: vi.fn(async () => ({
    code: 0,
    message: "success",
    data: { siteName: "原站点名称", siteDescription: "" },
  })),
  updateSystemConfig: vi.fn(),
  testEmail: vi.fn(),
}))

function renderPage() {
  const router = createMemoryRouter([{ path: "/", element: <SystemPage /> }], {
    initialEntries: ["/"],
  })
  return render(
    <SiteConfigProvider>
      <RouterProvider router={router} />
    </SiteConfigProvider>
  )
}

describe("SystemPage", () => {
  beforeEach(() => {
    getSystemConfig.mockReset()
    getSystemConfig.mockResolvedValue({
      code: 0,
      message: "success",
      data: { ...configData },
    })
  })

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN")
    })
  })

  it("keeps unsaved edits when the language changes", async () => {
    renderPage()

    const input = (await screen.findByDisplayValue(
      "原站点名称"
    )) as HTMLInputElement

    fireEvent.change(input, { target: { value: "未保存的修改" } })
    expect(input).toHaveValue("未保存的修改")

    await act(async () => {
      await i18n.changeLanguage("en")
    })

    await waitFor(() => expect(input).toHaveValue("未保存的修改"))
    expect(getSystemConfig).toHaveBeenCalledTimes(1)
  })
})

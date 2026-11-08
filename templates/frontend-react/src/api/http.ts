import type { ApiResponse, QueryParams } from "@/types/common"

/**
 * HTTP 基础设施：只被 `api/client.ts` 使用。
 * 业务域文件（user.ts / role.ts ...）和页面一律通过 `apiClient` 调用，不要直接 import 本文件。
 */

const BASE_URL = "/api"

/** 登录态失效：清理本地凭证并跳转登录页 */
function redirectToLogin() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.replace("/login")
}

/** 拼接查询串；空值不参与拼接 */
export function buildUrl(path: string, params?: QueryParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value))
      }
    })
  }
  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

/** 读取本地 token 生成鉴权头；未登录时返回空对象 */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 从 Content-Disposition 解析文件名，优先 RFC 5987 的 filename* */
export function parseFilename(disposition: string | null): string {
  if (!disposition) return ""
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  const raw = utf8?.[1] ?? /filename="?([^";]+)"?/i.exec(disposition)?.[1]
  if (!raw) return ""
  try {
    return decodeURIComponent(raw)
  } catch {
    // 文件名里出现裸 % 时无法解码，按原文返回
    return raw
  }
}

/** 发送 JSON 请求并统一成 `{ code, message, data }`；网络与 HTTP 错误都不抛异常 */
export async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
      ...authHeaders(),
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      redirectToLogin()
      return { code: -1, message: "未登录或登录已过期", data: undefined as T }
    }

    if (response.status === 204) {
      return { code: 0, message: "success", data: undefined as T }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        code: -1,
        message:
          errorData?.message || errorData?.detail || `HTTP ${response.status}`,
        data: undefined as T,
      }
    }

    return await response.json()
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { code: -1, message: "请求已取消", data: undefined as T }
    }
    return {
      code: -1,
      message: (error as Error).message || "网络请求失败",
      data: undefined as T,
    }
  }
}

/** 发送原始请求，返回 Response；失败时抛异常（供下载、上传等非 JSON 场景使用） */
export async function requestRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...authHeaders(),
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    redirectToLogin()
    throw new Error("未登录或登录已过期")
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(
      errorData?.message || errorData?.detail || `HTTP ${response.status}`
    )
  }
  return response
}

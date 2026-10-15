import type { ApiResponse } from "@/types/common"

const BASE_URL = "/api"

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("token")
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
        return { code: -1, message: "未登录或登录已过期", data: undefined as T }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        return {
          code: -1,
          message: errorData?.detail || `HTTP ${response.status}`,
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

  private async raw(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw new Error("未登录或登录已过期")
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || errorData?.detail || `HTTP ${response.status}`)
    }
    return response
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    const url = queryString ? `${path}?${queryString}` : path
    return this.request<T>(url)
  }

  async post<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" })
  }

  async download(path: string, options: RequestInit = {}) {
    const response = await this.raw(path, options)
    const disposition = response.headers.get("Content-Disposition") || ""
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    return {
      blob: await response.blob(),
      headers: response.headers,
      filename: match ? decodeURIComponent(match[1].replace(/"/g, "")) : "",
    }
  }

  async upload<T>(path: string, data: FormData): Promise<ApiResponse<T>> {
    const response = await this.raw(path, {
      method: "POST",
      body: data,
    })
    return response.json()
  }

  async getWithHeaders<T>(
    path: string,
    headers: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const response = await this.raw(path, { headers })
    return response.json()
  }
}

export const apiClient = new ApiClient()

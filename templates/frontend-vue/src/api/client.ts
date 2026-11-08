import type { ApiResponse, QueryParams } from "@/types/common"
import { buildUrl, parseFilename, requestJson, requestRaw } from "@/api/http"

/**
 * 业务域 API 的统一入口：`api/user.ts`、`api/role.ts` 等都只调用这里的方法。
 * 页面不要直接 import `api/http.ts`，也不要在 `api/` 里直接写 fetch。
 */
class ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return requestJson<T>(buildUrl(path, params))
  }

  post<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return requestJson<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return requestJson<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return requestJson<T>(path, { method: "DELETE" })
  }

  /** 下载二进制文件；返回 Blob、响应头与解析出的文件名 */
  async download(path: string, options: RequestInit = {}) {
    const response = await requestRaw(path, options)
    return {
      blob: await response.blob(),
      headers: response.headers,
      filename: parseFilename(response.headers.get("Content-Disposition")),
    }
  }

  /** multipart 上传（FormData）；不设置 Content-Type 以保留 boundary */
  async upload<T>(path: string, data: FormData): Promise<ApiResponse<T>> {
    const response = await requestRaw(path, { method: "POST", body: data })
    return response.json()
  }

  /** 需要自定义请求头的 GET，例如携带一次性任务 token */
  async getWithHeaders<T>(
    path: string,
    headers: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const response = await requestRaw(path, { headers })
    return response.json()
  }
}

export const apiClient = new ApiClient()

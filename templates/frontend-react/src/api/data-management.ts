import { apiClient } from "@/api/client"
import type {
  ExportResult,
  ImportJobHandle,
  ImportStatus,
} from "@/types/data-management"

export async function exportData(): Promise<ExportResult> {
  const response = await apiClient.download("/data/export", { method: "POST" })
  const password = response.headers.get("X-Export-Password")
  if (!password) throw new Error("服务器未返回导出密码")

  return {
    blob: response.blob,
    password,
    filename: response.filename || "fullstack-export.zip",
  }
}

export function startImport(file: File, password: string) {
  const data = new FormData()
  data.append("file", file)
  data.append("password", password)
  return apiClient.upload<ImportJobHandle>("/data/import", data)
}

export function getImportStatus(jobId: string, jobToken: string) {
  return apiClient.getWithHeaders<ImportStatus>(`/data/import/${jobId}`, {
    "X-Import-Job-Token": jobToken,
  })
}

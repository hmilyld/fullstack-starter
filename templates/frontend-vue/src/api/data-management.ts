import { apiClient } from '@/api/client'

export type ImportStatus = {
  id: string
  status: 'queued' | 'running' | 'success' | 'failed'
  message: string
  progress: number
}

export async function exportData() {
  const response = await apiClient.download('/data/export', { method: 'POST' })
  const password = response.headers.get('X-Export-Password')
  if (!password) throw new Error('服务器未返回导出密码')

  return {
    blob: response.blob,
    password,
    filename: response.filename || 'fullstack-export.zip',
  }
}

export function startImport(file: File, password: string) {
  const data = new FormData()
  data.append('file', file)
  data.append('password', password)
  return apiClient.upload<{ jobId: string; jobToken: string; status: string }>(
    '/data/import',
    data,
  )
}

export function getImportStatus(jobId: string, jobToken: string) {
  return apiClient.getWithHeaders<ImportStatus>(`/data/import/${jobId}`, {
    'X-Import-Job-Token': jobToken,
  })
}

import { apiClient } from "@/api/client"
import type { AuditLog } from "@/types/audit-log"
import type { PaginatedData } from "@/types/common"

export async function getAuditLogs(params?: {
  userId?: string
  status?: string
  action?: string
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<AuditLog>>("/audit-logs", params)
}

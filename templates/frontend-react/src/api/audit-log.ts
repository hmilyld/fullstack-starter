import { apiClient } from "@/api/client"
import type { AuditLog, AuditLogQuery } from "@/types/audit-log"
import type { PaginatedData } from "@/types/common"

export async function getAuditLogs(params?: AuditLogQuery) {
  return apiClient.get<PaginatedData<AuditLog>>("/audit-logs", params)
}

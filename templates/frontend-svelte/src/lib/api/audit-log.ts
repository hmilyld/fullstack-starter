import { apiClient } from "#lib/api/client.js"
import type { AuditLog, AuditLogQuery } from "#lib/types/audit-log.js"
import type { PaginatedData } from "#lib/types/common.js"

export async function getAuditLogs(params?: AuditLogQuery) {
  return apiClient.get<PaginatedData<AuditLog>>("/audit-logs", params)
}

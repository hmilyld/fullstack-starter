export type AuditLog = {
  id: string
  userId: string
  username: string
  action: string
  ip: string
  status: "success" | "permission_denied" | "fail"
  detail: string
  createdAt: string
}

export type AuditFilterKey =
  "userId" | "status" | "action" | "startTime" | "endTime"

export type AuditFilters = Record<AuditFilterKey, string>

/** 审计日志列表查询参数；过滤项均可选 */
export type AuditLogQuery = Partial<AuditFilters> & {
  page?: number
  pageSize?: number
}

export type AuditFilterKey =
  "userId" | "status" | "action" | "startTime" | "endTime"

export type AuditFilters = Record<AuditFilterKey, string>

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

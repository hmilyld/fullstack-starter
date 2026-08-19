export type AuditLog = {
  id: string
  userId: string
  username: string
  action: string
  ip: string
  status: 'success' | 'permission_denied' | 'fail'
  detail: string
  createdAt: string
}

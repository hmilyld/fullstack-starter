import { Badge } from "@/components/ui/badge"
import type { Role } from "@/types/role"

/** 角色徽标：按角色 ID / 预设状态决定样式，不依赖中文角色名 */
export function RoleBadge({
  roleId,
  roles,
}: {
  roleId: string
  roles: Role[]
}) {
  const role = roles.find((item) => item.id === roleId)
  const variant =
    roleId === "admin" ? "default" : role?.isPreset ? "secondary" : "outline"

  return <Badge variant={variant}>{role?.name ?? "未知角色"}</Badge>
}

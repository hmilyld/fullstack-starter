import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const role = roles.find((item) => item.id === roleId)
  const variant =
    roleId === "admin" ? "default" : role?.isPreset ? "secondary" : "outline"

  const label = role
    ? t(`roles.${role.id}`, { defaultValue: role.name })
    : t("roles.unknown")

  return <Badge variant={variant}>{label}</Badge>
}

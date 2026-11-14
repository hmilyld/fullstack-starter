<script lang="ts">
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { t } from "#lib/i18n.js"
  import type { Role } from "#lib/types/role.js"

  let { roleId, roles }: { roleId: string; roles: Role[] } = $props()

  const role = $derived(roles.find((item) => item.id === roleId))
  const variant = $derived(
    roleId === "admin" ? "default" : role?.isPreset ? "secondary" : "outline"
  )
</script>

<Badge {variant}
  >{role
    ? $t(`roles.${role.id}`, { defaultValue: role.name })
    : $t("roles.unknown")}</Badge
>

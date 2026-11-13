<script lang="ts">
  import { Badge } from "#lib/components/ui/badge/index.js"
  import type { Role } from "#lib/types/role.js"

  let { roleId, roles }: { roleId: string; roles: Role[] } = $props()

  const role = $derived(roles.find((item) => item.id === roleId))
  const variant = $derived(
    roleId === "admin" ? "default" : role?.isPreset ? "secondary" : "outline"
  )
</script>

<Badge {variant}>{role?.name ?? "未知角色"}</Badge>

<script setup lang="ts">
import { computed } from "vue"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@/types/role"

const props = defineProps<{
  roleId: string
  roles: Role[]
}>()

const role = computed(() =>
  props.roles.find((item) => item.id === props.roleId)
)
const variant = computed(() => {
  if (props.roleId === "admin") return "default"
  return role.value?.isPreset ? "secondary" : "outline"
})
</script>

<template>
  <Badge :variant="variant">{{ role?.name ?? "未知角色" }}</Badge>
</template>

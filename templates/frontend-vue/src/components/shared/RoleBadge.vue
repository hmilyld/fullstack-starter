<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@/types/role"

const props = defineProps<{
  roleId: string
  roles: Role[]
}>()

const { t } = useI18n()
const role = computed(() =>
  props.roles.find((item) => item.id === props.roleId)
)
const label = computed(() =>
  role.value ? t(`roles.${role.value.id}`, role.value.name) : t("roles.unknown")
)
const variant = computed(() => {
  if (props.roleId === "admin") return "default"
  return role.value?.isPreset ? "secondary" : "outline"
})
</script>

<template>
  <Badge :variant="variant">{{ label }}</Badge>
</template>

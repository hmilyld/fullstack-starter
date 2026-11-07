<script setup lang="ts">
import { menuIcons, type MenuIconName } from "@/lib/icons"

defineProps<{
  name: string
}>()
</script>

<template>
  <component :is="menuIcons[name as MenuIconName] || menuIcons.circle" />
</template>

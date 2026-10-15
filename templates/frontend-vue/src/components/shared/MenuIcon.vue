<script setup lang="ts">
import {
  Bot,
  Circle,
  Database,
  FileText,
  KeyRound,
  LayoutDashboard,
  PanelLeft,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'

defineProps<{
  name: string
}>()

const iconMap = {
  circle: Circle,
  'layout-dashboard': LayoutDashboard,
  users: Users,
  'shield-check': ShieldCheck,
  'key-round': KeyRound,
  'panel-left': PanelLeft,
  settings: Settings2,
  bot: Bot,
  'file-text': FileText,
  database: Database,
}
</script>

<template>
  <component :is="iconMap[name as keyof typeof iconMap] || Circle" />
</template>

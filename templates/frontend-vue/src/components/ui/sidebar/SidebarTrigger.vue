<script setup lang="ts">
import type { HTMLAttributes } from "vue"

import { useI18n } from "vue-i18n"
import { PanelLeftIcon } from "@lucide/vue"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const { t } = useI18n()
const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="outline"
    size="icon-sm"
    :class="cn('', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeftIcon />
    <span class="sr-only">{{ t("sidebar.toggle") }}</span>
  </Button>
</template>

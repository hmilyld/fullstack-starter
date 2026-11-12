<script setup lang="ts">
import type { Component } from "vue"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type SettingsNavItem = {
  value: string
  title: string
  icon: Component
}

defineProps<{
  items: SettingsNavItem[]
  class?: string
}>()
</script>

<template>
  <TabsList
    :class="
      cn(
        'w-full flex-wrap justify-start gap-1 bg-transparent p-0',
        'md:sticky md:top-20 md:w-1/5 md:min-w-40 md:flex-col md:flex-nowrap',
        $props.class
      )
    "
  >
    <TabsTrigger
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="flex-none justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-accent hover:text-foreground data-active:bg-muted data-active:font-medium data-active:text-foreground dark:data-active:bg-muted"
    >
      <component :is="item.icon" class="size-4 shrink-0" />
      {{ item.title }}
    </TabsTrigger>
  </TabsList>
</template>

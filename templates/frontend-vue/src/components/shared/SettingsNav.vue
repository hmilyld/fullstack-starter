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
        'w-full justify-start gap-1 overflow-x-auto bg-transparent p-0',
        'lg:sticky lg:top-20 lg:w-1/5 lg:min-w-44 lg:flex-col lg:overflow-visible',
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

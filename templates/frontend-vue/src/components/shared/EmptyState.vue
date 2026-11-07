<script setup lang="ts">
import type { Component } from "vue"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>

<template>
  <Empty :class="cn('border py-12', $attrs.class)">
    <EmptyHeader>
      <EmptyMedia v-if="icon" variant="icon">
        <component :is="icon" />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription v-if="description || $slots.description">
        <slot name="description">{{ description }}</slot>
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.action">
      <slot name="action" />
    </EmptyContent>
  </Empty>
</template>

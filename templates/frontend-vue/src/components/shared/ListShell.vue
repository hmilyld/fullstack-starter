<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <Card :class="$attrs.class">
    <CardHeader>
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-col gap-1">
          <CardTitle>{{ title }}</CardTitle>
          <CardDescription v-if="description || $slots.description">
            <slot name="description">{{ description }}</slot>
          </CardDescription>
        </div>
        <div
          v-if="$slots.actions"
          class="flex flex-col gap-2 md:flex-row md:items-center"
        >
          <slot name="actions" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <slot />
      <div v-if="$slots.footer" class="pt-4">
        <slot name="footer" />
      </div>
    </CardContent>
  </Card>
</template>

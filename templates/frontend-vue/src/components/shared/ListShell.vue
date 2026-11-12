<script setup lang="ts">
defineProps<{
  /** 左侧的计数/统计说明，如「共 5 位用户」 */
  description?: string
}>()
</script>

<template>
  <div :class="$attrs.class" class="flex flex-col gap-3">
    <div
      v-if="description !== undefined || $slots.description || $slots.actions"
      class="flex flex-col gap-2 md:flex-row md:items-center"
    >
      <p
        v-if="description !== undefined || $slots.description"
        class="text-sm text-muted-foreground"
      >
        <slot name="description">{{ description }}</slot>
      </p>
      <div
        v-if="$slots.actions"
        class="flex flex-col gap-2 md:ml-auto md:flex-row md:items-center"
      >
        <slot name="actions" />
      </div>
    </div>
    <slot />
    <div v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

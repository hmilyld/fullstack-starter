<script setup lang="ts">
defineProps<{
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}>()
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled || loading"
    :class="['btn', $attrs.class]"
  >
    <span v-if="loading" class="loading loading-spinner loading-sm"></span>
    <slot />
  </button>
</template>

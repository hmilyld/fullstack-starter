<script setup lang="ts">
import type { ButtonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

withDefaults(
  defineProps<{
    loading?: boolean
    disabled?: boolean
    type?: "button" | "submit" | "reset"
    variant?: ButtonVariants["variant"]
    size?: ButtonVariants["size"]
  }>(),
  {
    type: "button",
    variant: "default",
    size: "default",
  }
)
</script>

<template>
  <Button
    :type="type"
    :variant="variant"
    :size="size"
    :aria-busy="loading"
    :disabled="disabled || loading"
    :class="cn($attrs.class)"
  >
    <Spinner v-if="loading" data-icon="inline-start" />
    <slot />
  </Button>
</template>

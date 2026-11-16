<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useI18n } from "vue-i18n"

import { Loader2Icon } from "@lucide/vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const { t } = useI18n()
</script>

<template>
  <Loader2Icon
    data-slot="spinner"
    role="status"
    :aria-label="t('common.loading')"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>

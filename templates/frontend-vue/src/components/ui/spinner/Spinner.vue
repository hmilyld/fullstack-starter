<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useI18n } from "vue-i18n"

import { Loader2Icon } from "@lucide/vue"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    /** 放在已有文字或 aria-busy 的控件内时，不要再重复播报 */
    decorative?: boolean
  }>(),
  { decorative: false }
)

const { t } = useI18n()
</script>

<template>
  <Loader2Icon
    data-slot="spinner"
    :role="props.decorative ? undefined : 'status'"
    :aria-label="props.decorative ? undefined : t('common.loading')"
    :aria-hidden="props.decorative || undefined"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>

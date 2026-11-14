<script setup lang="ts">
import type { PaginationEllipsisProps } from "reka-ui"

import type { HTMLAttributes } from "vue"
import { useI18n } from "vue-i18n"
import { MoreHorizontalIcon } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "@/lib/utils"
import { PaginationEllipsis } from "reka-ui"

const props = defineProps<
  PaginationEllipsisProps & { class?: HTMLAttributes["class"] }
>()

const { t } = useI18n()
const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <PaginationEllipsis
    data-slot="pagination-ellipsis"
    v-bind="delegatedProps"
    :class="
      cn(
        'flex size-9 items-center justify-center [&_svg:not([class*=size-])]:size-4',
        props.class
      )
    "
  >
    <slot>
      <MoreHorizontalIcon />
      <span class="sr-only">{{ t("common.pagination.more") }}</span>
    </slot>
  </PaginationEllipsis>
</template>

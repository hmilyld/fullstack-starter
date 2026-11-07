<script setup lang="ts">
import { computed } from "vue"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "@lucide/vue"
import { Button } from "@/components/ui/button"

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    total: number
    itemLabel?: string
  }>(),
  {
    itemLabel: "条记录",
  }
)

const emit = defineEmits<{
  (e: "page-change", page: number): void
}>()

function getPageItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const visible = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  let previous = 0
  for (const value of visible) {
    if (value - previous > 1) result.push("ellipsis")
    result.push(value)
    previous = value
  }
  return result
}

const pageItems = computed(() => getPageItems(props.page, props.totalPages))
</script>

<template>
  <div
    class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
  >
    <p class="text-sm text-muted-foreground">
      共 {{ total }} {{ itemLabel }}，第 {{ page }} / {{ totalPages }} 页
    </p>
    <nav
      aria-label="分页"
      class="mx-auto flex w-full justify-center md:mx-0 md:w-auto md:justify-end"
    >
      <ul class="flex items-center gap-1">
        <li>
          <Button
            variant="ghost"
            size="sm"
            :disabled="page <= 1"
            @click="emit('page-change', page - 1)"
          >
            <ChevronLeft data-icon="inline-start" />
            上一页
          </Button>
        </li>
        <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
          <li v-if="item === 'ellipsis'" class="hidden md:flex">
            <span
              aria-hidden="true"
              class="flex size-8 items-center justify-center [&_svg:not([class*=size-])]:size-4"
            >
              <MoreHorizontal />
              <span class="sr-only">更多页</span>
            </span>
          </li>
          <li v-else class="hidden md:flex">
            <Button
              :variant="item === page ? 'outline' : 'ghost'"
              size="icon-sm"
              :aria-current="item === page ? 'page' : undefined"
              @click="emit('page-change', Number(item))"
            >
              {{ item }}
            </Button>
          </li>
        </template>
        <li>
          <Button
            variant="ghost"
            size="sm"
            :disabled="page >= totalPages"
            @click="emit('page-change', page + 1)"
          >
            下一页
            <ChevronRight data-icon="inline-end" />
          </Button>
        </li>
      </ul>
    </nav>
  </div>
</template>

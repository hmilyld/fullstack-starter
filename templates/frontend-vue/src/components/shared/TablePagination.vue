<script setup lang="ts">
import { computed } from "vue"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    total: number
    itemLabel?: string
    pageSize?: number
    pageSizeOptions?: number[]
  }>(),
  {
    itemLabel: "条记录",
    pageSizeOptions: () => [10, 20, 50],
  }
)

const emit = defineEmits<{
  (e: "page-change", page: number): void
  (e: "page-size-change", pageSize: number): void
}>()

const showPageSize = computed(() => props.pageSize !== undefined)

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
const pageSizeModel = computed({
  get: () => String(props.pageSize ?? ""),
  set: (value: string) => emit("page-size-change", Number(value)),
})
</script>

<template>
  <div
    class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
  >
    <div
      class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
    >
      <p>共 {{ total }} {{ itemLabel }}，第 {{ page }} / {{ totalPages }} 页</p>
      <label v-if="showPageSize" class="flex items-center gap-2 text-xs">
        每页
        <Select v-model="pageSizeModel">
          <SelectTrigger
            size="sm"
            class="h-8 w-[76px]"
            aria-label="每页显示条数"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in pageSizeOptions"
              :key="option"
              :value="String(option)"
            >
              {{ option }} 条
            </SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>

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
        <li
          v-for="(item, index) in pageItems"
          :key="`${item}-${index}`"
          class="hidden md:block"
        >
          <Button
            v-if="item === 'ellipsis'"
            variant="ghost"
            size="icon-sm"
            disabled
            aria-hidden="true"
          >
            <MoreHorizontal />
          </Button>
          <Button
            v-else
            :variant="item === page ? 'outline' : 'ghost'"
            size="icon-sm"
            :aria-current="item === page ? 'page' : undefined"
            @click="emit('page-change', item as number)"
          >
            {{ item }}
          </Button>
        </li>
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

<script setup lang="ts" generic="T extends { id: string }">
import type { Component } from "vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import InlineError from "@/components/shared/InlineError.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type DataColumn = {
  key: string
  header: string
  hideable?: boolean
  defaultHidden?: boolean
  headClass?: string
  cellClass?: string
  pinRight?: boolean
}

withDefaults(
  defineProps<{
    items: T[]
    loading: boolean
    error: string | null
    columns: DataColumn[]
    empty: { icon?: Component; title: string; description?: string }
    skeletonColSpan?: number
  }>(),
  { skeletonColSpan: 5 }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <InlineError
    v-if="error && items.length > 0"
    :message="error"
    @retry="emit('retry')"
  />

  <TableSkeletonRow
    v-if="loading && items.length === 0"
    :col-span="skeletonColSpan"
  />
  <ErrorState
    v-else-if="error && items.length === 0"
    :message="error"
    @retry="emit('retry')"
  />
  <EmptyState
    v-else-if="items.length === 0"
    :icon="empty.icon"
    :title="empty.title"
    :description="empty.description"
  >
    <template v-if="$slots['empty-action']" #action>
      <slot name="empty-action" />
    </template>
  </EmptyState>

  <template v-else>
    <div class="flex flex-col gap-2 md:hidden">
      <template v-for="item in items" :key="item.id">
        <slot name="card" :row="item" />
      </template>
    </div>
    <div class="hidden md:block">
      <Table sticky>
        <TableHeader
          class="[&_th]:sticky [&_th]:top-16 [&_th]:z-10 [&_th]:border-b [&_th]:border-border [&_th]:bg-card"
        >
          <TableRow>
            <TableHead
              v-for="column in columns"
              :key="column.key"
              :class="
                cn(
                  column.headClass,
                  column.pinRight && 'sticky right-0 bg-card'
                )
              "
            >
              <slot :name="`head-${column.key}`">{{ column.header }}</slot>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in items" :key="item.id">
            <TableCell
              v-for="column in columns"
              :key="column.key"
              :class="
                cn(
                  column.cellClass,
                  column.pinRight && 'sticky right-0 bg-inherit'
                )
              "
            >
              <slot :name="`cell-${column.key}`" :row="item" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </template>
</template>

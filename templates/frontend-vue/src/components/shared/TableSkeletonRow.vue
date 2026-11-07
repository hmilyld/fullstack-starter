<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

withDefaults(
  defineProps<{
    colSpan?: number
  }>(),
  {
    colSpan: 5,
  }
)
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="rowIndex in 5" :key="rowIndex">
        <TableCell v-for="columnIndex in colSpan" :key="columnIndex">
          <Skeleton class="h-4 w-full" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

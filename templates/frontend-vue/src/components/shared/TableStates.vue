<script setup lang="ts">
defineProps<{
  colSpan?: number
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <div class="skeleton h-8 w-48"></div>
      <div class="skeleton h-4 w-64"></div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="skeleton h-4 w-32"></div>
        <div class="skeleton h-10 w-24"></div>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th v-for="i in (colSpan || 5)" :key="i"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 5" :key="i">
              <td v-for="j in (colSpan || 5)" :key="j">
                <div class="skeleton h-4 w-full"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

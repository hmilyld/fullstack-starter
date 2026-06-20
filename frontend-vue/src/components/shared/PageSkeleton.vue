<script setup lang="ts">
defineProps<{
  rows?: number
  cols?: number
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Title skeleton -->
    <div class="flex flex-col gap-2">
      <div class="skeleton h-8 w-48"></div>
      <div class="skeleton h-4 w-64"></div>
    </div>

    <!-- Content skeleton -->
    <div class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <!-- Header skeleton -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-2">
            <div class="skeleton h-5 w-32"></div>
            <div class="skeleton h-4 w-24"></div>
          </div>
          <div class="flex gap-2">
            <div class="skeleton h-10 w-48"></div>
            <div class="skeleton h-10 w-24"></div>
          </div>
        </div>

        <!-- Table skeleton -->
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th v-for="i in (cols || 5)" :key="i">
                  <div class="skeleton h-4 w-full"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in (rows || 5)" :key="i">
                <td v-for="j in (cols || 5)" :key="j">
                  <div class="skeleton h-4 w-full"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination skeleton -->
        <div class="flex items-center justify-between pt-4">
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-8 w-48"></div>
        </div>
      </div>
    </div>
  </div>
</template>

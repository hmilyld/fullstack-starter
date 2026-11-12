<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <Skeleton class="h-8 w-56" />
    <div class="flex flex-col gap-(--page-gap) rounded-xl border bg-card p-5">
      <div class="flex flex-col gap-2">
        <Skeleton class="h-5 w-32" />
        <Skeleton class="h-4 w-64" />
      </div>
      <div class="flex flex-col gap-4">
        <div v-for="index in 4" :key="index" class="flex flex-col gap-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-8 w-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router"
import { Compass } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import { Button } from "@/components/ui/button"
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-6">
    <EmptyState
      class="max-w-lg"
      :icon="Compass"
      title="页面不存在"
      description="地址可能已更改，或者您没有访问该页面的权限。"
    >
      <template #action>
        <Button as-child>
          <RouterLink to="/dashboard">返回仪表盘</RouterLink>
        </Button>
      </template>
    </EmptyState>
  </div>
</template>

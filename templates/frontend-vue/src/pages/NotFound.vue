<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-4xl font-bold">404</h1>
    <p class="text-lg text-base-content/50">页面不存在</p>
    <button class="btn btn-primary" @click="router.push('/dashboard')">返回仪表盘</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const jumpPage = ref('')

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = props.totalPages
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

function handleJump() {
  const num = parseInt(jumpPage.value)
  if (num >= 1 && num <= props.totalPages) {
    emit('update:page', num)
    jumpPage.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
    <span class="text-sm text-base-content/50">
      第 {{ page }} / {{ totalPages }} 页
    </span>
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="btn btn-outline btn-xs"
        :disabled="page <= 1"
        @click="emit('update:page', 1)"
      >
        首页
      </button>
      <button
        class="btn btn-outline btn-xs"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        上一页
      </button>

      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span v-if="p === '...'" class="px-1 text-base-content/50">...</span>
        <button
          v-else
          class="btn btn-xs"
          :class="p === page ? 'btn-primary' : 'btn-outline'"
          @click="emit('update:page', p as number)"
        >
          {{ p }}
        </button>
      </template>

      <button
        class="btn btn-outline btn-xs"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        下一页
      </button>
      <button
        class="btn btn-outline btn-xs"
        :disabled="page >= totalPages"
        @click="emit('update:page', totalPages)"
      >
        末页
      </button>

      <div class="flex items-center gap-1">
        <span class="text-xs text-base-content/50">跳至</span>
        <input
          v-model="jumpPage"
          type="number"
          class="input input-bordered input-xs w-14 text-center"
          :min="1"
          :max="totalPages"
          @keyup.enter="handleJump"
        />
        <span class="text-xs text-base-content/50">页</span>
      </div>
    </div>
  </div>
</template>

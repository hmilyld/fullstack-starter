<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  open: boolean
  targetName: string
  description?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const cancelBtn = ref<HTMLButtonElement | null>(null)

watch(() => props.open, async (val) => {
  if (val) {
    dialog.value?.showModal()
    await nextTick()
    cancelBtn.value?.focus()
  } else {
    dialog.value?.close()
  }
})

function close() {
  emit('update:open', false)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !props.loading) {
    e.preventDefault()
    emit('confirm')
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    @close="close"
    @keydown="handleKeydown"
  >
    <div class="modal-box">
      <h3 class="text-lg font-bold">确认删除</h3>
      <p class="py-4">
        确定要删除 <span class="font-bold">{{ targetName }}</span> 吗？此操作不可撤销。
        <span v-if="description" class="block mt-1 text-base-content/70">{{ description }}</span>
      </p>
      <div class="modal-action">
        <button ref="cancelBtn" class="btn" @click="close">取消</button>
        <button class="btn btn-error" :disabled="loading" @click="emit('confirm')">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          删除
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

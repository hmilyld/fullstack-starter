<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = [
  { value: 'circle', label: '默认' },
  { value: 'layout-dashboard', label: '仪表盘' },
  { value: 'users', label: '用户' },
  { value: 'shield-check', label: '角色' },
  { value: 'key-round', label: '权限' },
  { value: 'panel-left', label: '菜单' },
  { value: 'settings', label: '设置' },
  { value: 'bot', label: 'AI' },
  { value: 'file-text', label: '文档' },
  { value: 'database', label: '数据' },
]

</script>

<template>
  <select
    class="select select-bordered w-full"
    :value="modelValue"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="item in options" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>

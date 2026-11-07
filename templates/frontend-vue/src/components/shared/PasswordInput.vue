<script setup lang="ts">
import { ref } from "vue"
import { Eye, EyeOff } from "@lucide/vue"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

defineOptions({
  inheritAttrs: false,
})

const model = defineModel<string>({ default: "" })
const visible = ref(false)
</script>

<template>
  <InputGroup>
    <InputGroupInput
      v-model="model"
      :type="visible ? 'text' : 'password'"
      v-bind="$attrs"
    />
    <InputGroupAddon align="inline-end">
      <InputGroupButton
        size="icon-xs"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" />
        <Eye v-else />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</template>

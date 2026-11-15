<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
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
const { t } = useI18n()
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
        :aria-label="
          visible ? t('common.password.hide') : t('common.password.show')
        "
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" />
        <Eye v-else />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</template>

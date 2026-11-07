<script setup lang="ts">
import { computed } from "vue"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AuditFilters } from "@/types/audit-log"

const props = defineProps<{
  modelValue: AuditFilters
  prefix: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: AuditFilters): void
}>()

const statusValue = computed({
  get: () => props.modelValue.status || "all",
  set: (value: string) => update("status", value === "all" ? "" : value),
})

function update(key: keyof AuditFilters, value: string) {
  emit("update:modelValue", { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
    <Field>
      <FieldLabel :for="`${prefix}-user`">用户 ID</FieldLabel>
      <Input
        :id="`${prefix}-user`"
        name="audit-user"
        autocomplete="off"
        :spellcheck="false"
        :model-value="modelValue.userId"
        placeholder="例如：1"
        @update:model-value="update('userId', String($event))"
      />
    </Field>
    <Field>
      <FieldLabel>状态</FieldLabel>
      <Select v-model="statusValue">
        <SelectTrigger class="w-full" aria-label="状态">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="fail">失败</SelectItem>
            <SelectItem value="permission_denied">权限不足</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-action`">动作</FieldLabel>
      <Input
        :id="`${prefix}-action`"
        name="audit-action"
        autocomplete="off"
        :spellcheck="false"
        :model-value="modelValue.action"
        placeholder="例如：users.create"
        @update:model-value="update('action', String($event))"
      />
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-start`">开始时间</FieldLabel>
      <Input
        :id="`${prefix}-start`"
        name="audit-start"
        autocomplete="off"
        type="datetime-local"
        :model-value="modelValue.startTime"
        @update:model-value="update('startTime', String($event))"
      />
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-end`">结束时间</FieldLabel>
      <Input
        :id="`${prefix}-end`"
        name="audit-end"
        autocomplete="off"
        type="datetime-local"
        :model-value="modelValue.endTime"
        @update:model-value="update('endTime', String($event))"
      />
    </Field>
  </div>
</template>

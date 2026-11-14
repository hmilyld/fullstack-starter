<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import DateTimeField from "@/components/shared/DateTimeField.vue"
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

const { t } = useI18n()

const statusValue = computed({
  get: () => props.modelValue.status || "all",
  set: (value: string) => update("status", value === "all" ? "" : value),
})

function update(key: keyof AuditFilters, value: string) {
  emit("update:modelValue", { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
    <Field>
      <FieldLabel :for="`${prefix}-user`">{{
        t("auditLogPage.filters.userId")
      }}</FieldLabel>
      <Input
        :id="`${prefix}-user`"
        name="audit-user"
        autocomplete="off"
        :spellcheck="false"
        :model-value="modelValue.userId"
        :placeholder="t('auditLogPage.userPlaceholder')"
        @update:model-value="update('userId', String($event))"
      />
    </Field>
    <Field>
      <FieldLabel>{{ t("auditLogPage.filters.status") }}</FieldLabel>
      <Select v-model="statusValue">
        <SelectTrigger
          class="w-full"
          :aria-label="t('auditLogPage.filters.status')"
        >
          <SelectValue :placeholder="t('auditLogPage.allStatuses')" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{{
              t("auditLogPage.allStatuses")
            }}</SelectItem>
            <SelectItem value="success">{{
              t("auditLogPage.status.success")
            }}</SelectItem>
            <SelectItem value="fail">{{
              t("auditLogPage.status.fail")
            }}</SelectItem>
            <SelectItem value="permission_denied">{{
              t("auditLogPage.status.permission_denied")
            }}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-action`">{{
        t("auditLogPage.filters.action")
      }}</FieldLabel>
      <Input
        :id="`${prefix}-action`"
        name="audit-action"
        autocomplete="off"
        :spellcheck="false"
        :model-value="modelValue.action"
        :placeholder="t('auditLogPage.actionPlaceholder')"
        @update:model-value="update('action', String($event))"
      />
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-start`">{{
        t("auditLogPage.filters.startTime")
      }}</FieldLabel>
      <DateTimeField
        :id="`${prefix}-start`"
        name="audit-start"
        :model-value="modelValue.startTime"
        @update:model-value="update('startTime', $event)"
      />
    </Field>
    <Field>
      <FieldLabel :for="`${prefix}-end`">{{
        t("auditLogPage.filters.endTime")
      }}</FieldLabel>
      <DateTimeField
        :id="`${prefix}-end`"
        name="audit-end"
        :model-value="modelValue.endTime"
        @update:model-value="update('endTime', $event)"
      />
    </Field>
  </div>
</template>

<script lang="ts">
  import { Field, FieldLabel } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { t } from "#lib/i18n.js"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import type { AuditFilters } from "#lib/types/audit-log.js"
  import DateTimeField from "#lib/components/shared/date-time-field.svelte"

  let { value = $bindable(), prefix }: { value: AuditFilters; prefix: string } =
    $props()

  const statusValue = $derived(value.status || "all")
  const statusItems = $derived([
    { value: "all", label: $t("auditLogPage.allStatuses") },
    { value: "success", label: $t("auditLogPage.status.success") },
    { value: "fail", label: $t("auditLogPage.status.fail") },
    {
      value: "permission_denied",
      label: $t("auditLogPage.status.permission_denied"),
    },
  ])

  function update(key: keyof AuditFilters, next: string) {
    value = { ...value, [key]: next }
  }
</script>

<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
  <Field>
    <FieldLabel for={`${prefix}-user`}
      >{$t("auditLogPage.filters.userId")}</FieldLabel
    >
    <Input
      id={`${prefix}-user`}
      name="audit-user"
      autocomplete="off"
      spellcheck={false}
      value={value.userId}
      placeholder={$t("auditLogPage.userPlaceholder")}
      oninput={(event) => update("userId", event.currentTarget.value)}
    />
  </Field>
  <Field>
    <FieldLabel>{$t("auditLogPage.filters.status")}</FieldLabel>
    <Select
      type="single"
      items={statusItems}
      value={statusValue}
      onValueChange={(next) => update("status", next === "all" ? "" : next)}
    >
      <SelectTrigger
        class="w-full"
        aria-label={$t("auditLogPage.filters.status")}
      >
        <SelectValue placeholder={$t("auditLogPage.allStatuses")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">{$t("auditLogPage.allStatuses")}</SelectItem>
          <SelectItem value="success"
            >{$t("auditLogPage.status.success")}</SelectItem
          >
          <SelectItem value="fail">{$t("auditLogPage.status.fail")}</SelectItem>
          <SelectItem value="permission_denied"
            >{$t("auditLogPage.status.permission_denied")}</SelectItem
          >
        </SelectGroup>
      </SelectContent>
    </Select>
  </Field>
  <Field>
    <FieldLabel for={`${prefix}-action`}
      >{$t("auditLogPage.filters.action")}</FieldLabel
    >
    <Input
      id={`${prefix}-action`}
      name="audit-action"
      autocomplete="off"
      spellcheck={false}
      value={value.action}
      placeholder={$t("auditLogPage.actionPlaceholder")}
      oninput={(event) => update("action", event.currentTarget.value)}
    />
  </Field>
  <Field>
    <FieldLabel for={`${prefix}-start`}
      >{$t("auditLogPage.filters.startTime")}</FieldLabel
    >
    <DateTimeField
      id={`${prefix}-start`}
      name="audit-start"
      bind:value={value.startTime}
    />
  </Field>
  <Field>
    <FieldLabel for={`${prefix}-end`}
      >{$t("auditLogPage.filters.endTime")}</FieldLabel
    >
    <DateTimeField
      id={`${prefix}-end`}
      name="audit-end"
      bind:value={value.endTime}
    />
  </Field>
</div>

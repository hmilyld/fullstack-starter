<script lang="ts">
  import { Field, FieldLabel } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
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
  const statusItems = [
    { value: "all", label: "全部状态" },
    { value: "success", label: "成功" },
    { value: "fail", label: "失败" },
    { value: "permission_denied", label: "权限不足" },
  ]

  function update(key: keyof AuditFilters, next: string) {
    value = { ...value, [key]: next }
  }
</script>

<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
  <Field>
    <FieldLabel for={`${prefix}-user`}>用户 ID</FieldLabel>
    <Input
      id={`${prefix}-user`}
      name="audit-user"
      autocomplete="off"
      spellcheck={false}
      value={value.userId}
      placeholder="例如：1"
      oninput={(event) => update("userId", event.currentTarget.value)}
    />
  </Field>
  <Field>
    <FieldLabel>状态</FieldLabel>
    <Select
      type="single"
      items={statusItems}
      value={statusValue}
      onValueChange={(next) => update("status", next === "all" ? "" : next)}
    >
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
    <FieldLabel for={`${prefix}-action`}>动作</FieldLabel>
    <Input
      id={`${prefix}-action`}
      name="audit-action"
      autocomplete="off"
      spellcheck={false}
      value={value.action}
      placeholder="例如：users.create"
      oninput={(event) => update("action", event.currentTarget.value)}
    />
  </Field>
  <Field>
    <FieldLabel for={`${prefix}-start`}>开始时间</FieldLabel>
    <DateTimeField
      id={`${prefix}-start`}
      name="audit-start"
      bind:value={value.startTime}
    />
  </Field>
  <Field>
    <FieldLabel for={`${prefix}-end`}>结束时间</FieldLabel>
    <DateTimeField
      id={`${prefix}-end`}
      name="audit-end"
      bind:value={value.endTime}
    />
  </Field>
</div>

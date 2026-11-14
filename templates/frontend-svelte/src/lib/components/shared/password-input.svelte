<script lang="ts">
  import { Eye, EyeOff } from "@lucide/svelte"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"
  import { t } from "#lib/i18n.js"

  let {
    value = $bindable(""),
    ...restProps
  }: {
    value?: string
    [key: string]: unknown
  } = $props()

  let visible = $state(false)
</script>

<InputGroup>
  <InputGroupInput
    bind:value
    type={visible ? "text" : "password"}
    {...restProps}
  />
  <InputGroupAddon align="inline-end">
    <InputGroupButton
      size="icon-xs"
      aria-label={visible
        ? $t("common.password.hide")
        : $t("common.password.show")}
      onclick={() => (visible = !visible)}
    >
      {#if visible}<EyeOff />{:else}<Eye />{/if}
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>

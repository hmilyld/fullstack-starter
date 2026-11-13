<script lang="ts">
  import { Eye, EyeOff } from "@lucide/svelte"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"

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
      aria-label={visible ? "隐藏密码" : "显示密码"}
      onclick={() => (visible = !visible)}
    >
      {#if visible}<EyeOff />{:else}<Eye />{/if}
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>

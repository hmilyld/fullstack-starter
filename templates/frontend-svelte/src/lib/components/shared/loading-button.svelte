<script lang="ts">
  import type { Snippet } from "svelte"
  import { Button, type ButtonProps } from "#lib/components/ui/button/index.js"
  import { Spinner } from "#lib/components/ui/spinner/index.js"
  import { cn } from "#lib/utils.js"

  let {
    loading = false,
    disabled = false,
    type = "button",
    variant = "default",
    size = "default",
    children,
    class: className,
    ...restProps
  }: ButtonProps & {
    loading?: boolean
    children?: Snippet
  } = $props()
</script>

<Button
  {type}
  {variant}
  {size}
  aria-busy={loading}
  disabled={disabled || loading}
  class={cn(className)}
  {...restProps}
>
  {#if loading}<Spinner data-icon="inline-start" />{/if}
  {@render children?.()}
</Button>

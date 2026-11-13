<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    description,
    children,
    actions,
    footer,
    class: className,
    ...restProps
  }: {
    description?: string
    children?: Snippet
    actions?: Snippet
    footer?: Snippet
    class?: string
    [key: string]: unknown
  } = $props()
</script>

<div class={["flex flex-col gap-3", className]} {...restProps}>
  {#if description !== undefined || actions}
    <div class="flex flex-col gap-2 md:flex-row md:items-center">
      {#if description !== undefined}
        <p class="text-sm text-muted-foreground">{description}</p>
      {/if}
      {#if actions}
        <div class="flex flex-col gap-2 md:ml-auto md:flex-row md:items-center">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
  {#if footer}
    <div>{@render footer()}</div>
  {/if}
</div>

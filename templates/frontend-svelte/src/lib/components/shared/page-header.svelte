<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "#lib/utils.js"

  let {
    title,
    description,
    children,
    class: className,
    ...restProps
  }: {
    title: string
    description?: string
    children?: Snippet
    class?: string
    [key: string]: unknown
  } = $props()
</script>

<div
  class={cn(
    "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
    className
  )}
  {...restProps}
>
  <div class="flex flex-col gap-1">
    <h1 class="font-heading text-2xl font-semibold tracking-tight text-balance">
      {title}
    </h1>
    {#if description}
      <p class="text-sm text-pretty text-muted-foreground">{description}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex flex-col gap-2 md:flex-row md:items-center">
      {@render children()}
    </div>
  {/if}
</div>

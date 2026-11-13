<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "#lib/utils.js"

  let {
    title,
    titleContent,
    subtitle,
    leading,
    badges,
    meta,
    actions,
    class: className,
  }: {
    title?: string
    titleContent?: Snippet
    subtitle?: string
    leading?: Snippet
    badges?: Snippet
    meta?: Snippet
    actions?: Snippet
    class?: string
  } = $props()
</script>

<div
  class={cn(
    "flex items-start justify-between gap-3 rounded-xl border bg-card p-4",
    className
  )}
>
  {#if leading}{@render leading()}{/if}
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <span class="min-w-0 truncate text-sm font-medium">
        {#if titleContent}{@render titleContent()}{:else}{title}{/if}
      </span>
      {#if badges}{@render badges()}{/if}
    </div>
    {#if subtitle}
      <span class="truncate text-sm text-muted-foreground">{subtitle}</span>
    {/if}
    {#if meta}
      <div
        class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
      >
        {@render meta()}
      </div>
    {/if}
  </div>
  {#if actions}
    <div class="shrink-0">{@render actions()}</div>
  {/if}
</div>

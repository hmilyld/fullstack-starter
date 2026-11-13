<script lang="ts">
  import { cn, type WithElementRef } from "#lib/utils.js"
  import type { HTMLAttributes } from "svelte/elements"

  let {
    ref = $bindable(null),
    class: className,
    children,
    size = "default",
    variant = "default",
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    size?: "default" | "sm"
    variant?: "default" | "plain"
  } = $props()
</script>

<div
  bind:this={ref}
  data-slot="card"
  data-size={size}
  data-variant={variant}
  class={cn(
    "group/card flex flex-col gap-(--card-spacing) overflow-clip rounded-xl border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
    variant === "plain" &&
      "gap-5 overflow-visible border-0 bg-transparent py-0 shadow-none [--card-spacing:0px] [&_[data-slot=card-title]]:text-lg [&>[data-slot=card-header]]:border-b [&>[data-slot=card-header]]:pb-4",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>

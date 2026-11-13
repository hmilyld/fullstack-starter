<script lang="ts">
  import type { Component } from "svelte"
  import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
  } from "#lib/components/ui/empty/index.js"
  import { cn } from "#lib/utils.js"

  let {
    icon,
    title,
    description,
    children,
    class: className,
    ...restProps
  }: {
    icon?: Component
    title: string
    description?: string
    children?: import("svelte").Snippet
    class?: string
    [key: string]: unknown
  } = $props()
</script>

<Empty class={cn("border py-12", className)} {...restProps}>
  <EmptyHeader>
    {#if icon}
      {@const Icon = icon}
      <EmptyMedia variant="icon"><Icon /></EmptyMedia>
    {/if}
    <EmptyTitle>{title}</EmptyTitle>
    {#if description}
      <EmptyDescription>{description}</EmptyDescription>
    {/if}
  </EmptyHeader>
  {#if children}
    <EmptyContent>{@render children()}</EmptyContent>
  {/if}
</Empty>

<script lang="ts">
  import type { Component } from "svelte"
  import { TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.js"
  import { cn } from "#lib/utils.js"

  type SettingsNavItem = {
    value: string
    title: string
    icon: Component
  }

  let {
    items,
    class: className,
  }: { items: SettingsNavItem[]; class?: string } = $props()
</script>

<TabsList
  class={cn(
    "w-full flex-wrap justify-start gap-1 bg-transparent p-0",
    "lg:sticky lg:top-20 lg:w-1/5 lg:min-w-44 lg:flex-col lg:flex-nowrap",
    className
  )}
>
  {#each items as item (item.value)}
    {@const Icon = item.icon}
    <TabsTrigger
      value={item.value}
      class="min-h-9 flex-none justify-start gap-2 px-4 py-2 text-sm font-normal text-muted-foreground hover:bg-accent hover:text-foreground data-active:bg-muted data-active:font-medium data-active:text-foreground dark:data-active:bg-muted"
    >
      <Icon class="size-4 shrink-0" />
      {item.title}
    </TabsTrigger>
  {/each}
</TabsList>

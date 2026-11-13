<script lang="ts">
  import { Check, Rows3 } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import type { TableDensity } from "#lib/hooks/use-table-density.svelte.js"

  let {
    density,
    onChange,
    triggerClass,
  }: {
    density: TableDensity
    onChange: (density: TableDensity) => void
    triggerClass?: string
  } = $props()
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        size="icon-sm"
        aria-label="表格密度"
        title="表格密度"
        class={triggerClass}
      >
        <Rows3 />
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-36">
    <DropdownMenuLabel>表格密度</DropdownMenuLabel>
    <DropdownMenuItem onSelect={() => onChange("comfortable")}>
      <span class="flex size-4 items-center justify-center">
        {#if density === "comfortable"}<Check class="size-4" />{/if}
      </span>
      舒适
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => onChange("compact")}>
      <span class="flex size-4 items-center justify-center">
        {#if density === "compact"}<Check class="size-4" />{/if}
      </span>
      紧凑
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

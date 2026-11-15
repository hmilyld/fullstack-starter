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
  import { t } from "#lib/i18n.js"
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
        aria-label={$t("common.table.density")}
        title={$t("common.table.density")}
        class={triggerClass}
      >
        <Rows3 />
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-36">
    <DropdownMenuLabel>{$t("common.table.density")}</DropdownMenuLabel>
    <DropdownMenuItem onSelect={() => onChange("comfortable")}>
      <span class="flex size-4 items-center justify-center">
        {#if density === "comfortable"}<Check class="size-4" />{/if}
      </span>
      {$t("common.table.comfortable")}
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => onChange("compact")}>
      <span class="flex size-4 items-center justify-center">
        {#if density === "compact"}<Check class="size-4" />{/if}
      </span>
      {$t("common.table.compact")}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

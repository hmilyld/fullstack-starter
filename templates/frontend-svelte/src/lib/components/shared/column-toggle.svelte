<script lang="ts">
  import { Columns3 } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import { t } from "#lib/i18n.js"
  import { cn } from "#lib/utils.js"

  let {
    columns,
    hidden,
    onToggle,
    onReset,
    class: className,
  }: {
    columns: { key: string; header: string; hideable?: boolean }[]
    hidden: string[]
    onToggle: (key: string) => void
    onReset: () => void
    class?: string
  } = $props()

  const hideable = $derived(columns.filter((column) => column.hideable))
</script>

{#if hideable.length > 0}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          class={cn("w-full md:w-fit", className)}
        >
          <Columns3 data-icon="inline-start" />
          {$t("common.table.columns")}
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{$t("common.table.showColumns")}</DropdownMenuLabel>
      {#each hideable as column (column.key)}
        <DropdownMenuCheckboxItem
          checked={!hidden.includes(column.key)}
          onCheckedChange={() => onToggle(column.key)}
          closeOnSelect={false}
        >
          {column.header}
        </DropdownMenuCheckboxItem>
      {/each}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onReset}
        >{$t("common.table.resetColumns")}</DropdownMenuItem
      >
    </DropdownMenuContent>
  </DropdownMenu>
{/if}

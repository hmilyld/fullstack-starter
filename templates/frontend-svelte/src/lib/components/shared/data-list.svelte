<script lang="ts" generics="T extends { id: string }">
  import type { Component, Snippet } from "svelte"
  import { MoreHorizontal } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import ErrorState from "#lib/components/shared/error-state.svelte"
  import InlineError from "#lib/components/shared/inline-error.svelte"
  import TableSkeletonRow from "#lib/components/shared/table-skeleton-row.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "#lib/components/ui/table/index.js"
  import { cn } from "#lib/utils.js"
  import type { DataColumn } from "#lib/components/shared/data-column.js"

  let {
    items,
    loading,
    error,
    columns,
    empty,
    cell,
    card,
    head,
    emptyAction,
    onRetry,
    onHideColumn,
    stickyHeader = true,
    bordered = true,
    density = "comfortable",
    skeletonColSpan = 5,
  }: {
    items: T[]
    loading: boolean
    error: string | null
    columns: DataColumn[]
    empty: { icon?: Component; title: string; description?: string }
    cell?: Snippet<[string, T]>
    card?: Snippet<[T]>
    head?: Snippet<[string]>
    emptyAction?: Snippet
    onRetry: () => void
    onHideColumn: (key: string) => void
    stickyHeader?: boolean
    bordered?: boolean
    density?: "comfortable" | "compact"
    skeletonColSpan?: number
  } = $props()
</script>

{#if error && items.length > 0}
  <InlineError message={error} {onRetry} />
{/if}

{#if loading && items.length === 0}
  <div
    class="overflow-clip rounded-xl border bg-card max-md:rounded-none max-md:border-0"
  >
    <TableSkeletonRow colSpan={skeletonColSpan} />
  </div>
{:else if error && items.length === 0}
  <ErrorState message={error} {onRetry} />
{:else if items.length === 0}
  <EmptyState
    icon={empty.icon}
    title={empty.title}
    description={empty.description}
  >
    {#if emptyAction}{@render emptyAction()}{/if}
  </EmptyState>
{:else}
  {#if card}
    <div class="flex flex-col gap-2 md:hidden">
      {#each items as item (item.id)}
        {@render card(item)}
      {/each}
    </div>
  {/if}
  <div
    data-density={density}
    class={cn(
      "hidden md:block",
      bordered && "overflow-clip rounded-xl border bg-card",
      density === "compact" && "[&_td]:py-1.5 [&_th]:h-9"
    )}
  >
    <Table>
      <TableHeader
        class={cn(
          "[&_th]:border-b [&_th]:border-border [&_th]:bg-card",
          "pointer-events-none [&_button]:pointer-events-auto",
          stickyHeader && "[&_th]:sticky [&_th]:top-16 [&_th]:z-10"
        )}
      >
        <TableRow>
          {#each columns as column (column.key)}
            <TableHead
              class={cn(
                column.headClass,
                column.pinRight && "sticky right-0 bg-card"
              )}
            >
              <div class="group/col flex items-center gap-1">
                <span class="min-w-0 truncate">
                  {#if head}
                    {@render head(column.key)}
                  {:else}
                    {column.header}
                  {/if}
                </span>
                {#if column.hideable}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon-xs"
                          aria-label="列选项"
                          class="-mr-1 opacity-0 transition-opacity group-hover/col:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
                        >
                          <MoreHorizontal />
                        </Button>
                      {/snippet}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onSelect={() => onHideColumn(column.key)}
                      >
                        隐藏此列
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                {/if}
              </div>
            </TableHead>
          {/each}
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each items as item (item.id)}
          <TableRow>
            {#each columns as column (column.key)}
              <TableCell
                class={cn(
                  column.cellClass,
                  column.pinRight && "sticky right-0 bg-inherit"
                )}
              >
                {#if cell}{@render cell(column.key, item)}{/if}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
{/if}

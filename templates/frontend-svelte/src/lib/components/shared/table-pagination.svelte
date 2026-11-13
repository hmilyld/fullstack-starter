<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
  } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"

  let {
    page,
    totalPages,
    total,
    itemLabel = "条记录",
    pageSize,
    pageSizeOptions = [10, 20, 50],
    onPageChange,
    onPageSizeChange,
  }: {
    page: number
    totalPages: number
    total: number
    itemLabel?: string
    pageSize?: number
    pageSizeOptions?: number[]
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  } = $props()

  function getPageItems(page: number, totalPages: number) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const visible = Array.from(
      new Set([1, totalPages, page - 1, page, page + 1])
    )
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b)

    const result: (number | "ellipsis")[] = []
    let previous = 0
    for (const value of visible) {
      if (value - previous > 1) result.push("ellipsis")
      result.push(value)
      previous = value
    }
    return result
  }

  const pageItems = $derived(getPageItems(page, totalPages))
  const pageSizeModel = $derived(String(pageSize ?? ""))
  const pageSizeItems = $derived(
    pageSizeOptions.map((option) => ({
      value: String(option),
      label: `${option} 条`,
    }))
  )
</script>

<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
  >
    <p>共 {total} {itemLabel}，第 {page} / {totalPages} 页</p>
    {#if pageSize !== undefined && onPageSizeChange}
      <label class="flex items-center gap-2 text-xs">
        每页
        <Select
          type="single"
          items={pageSizeItems}
          value={pageSizeModel}
          onValueChange={(value) => {
            if (value) onPageSizeChange(Number(value))
          }}
        >
          <SelectTrigger
            size="sm"
            class="h-8 w-[76px]"
            aria-label="每页显示条数"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {#each pageSizeOptions as option (option)}
              <SelectItem value={String(option)} label={`${option} 条`}>
                {option} 条
              </SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </label>
    {/if}
  </div>

  <nav
    aria-label="分页"
    class="mx-auto flex w-full justify-center md:mx-0 md:w-auto md:justify-end"
  >
    <ul class="flex items-center gap-1">
      <li class="hidden md:block">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          aria-label="第一页"
          onclick={() => onPageChange(1)}
        >
          <ChevronsLeft />
        </Button>
      </li>
      <li>
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onclick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          上一页
        </Button>
      </li>
      {#each pageItems as item, index (`${item}-${index}`)}
        <li class="hidden md:block">
          {#if item === "ellipsis"}
            <Button variant="ghost" size="icon-sm" disabled aria-hidden="true">
              <MoreHorizontal />
            </Button>
          {:else}
            <Button
              variant={item === page ? "default" : "ghost"}
              size="icon-sm"
              aria-current={item === page ? "page" : undefined}
              onclick={() => onPageChange(item)}
            >
              {item}
            </Button>
          {/if}
        </li>
      {/each}
      <li>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onclick={() => onPageChange(page + 1)}
        >
          下一页
          <ChevronRight data-icon="inline-end" />
        </Button>
      </li>
      <li class="hidden md:block">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          aria-label="最后一页"
          onclick={() => onPageChange(totalPages)}
        >
          <ChevronsRight />
        </Button>
      </li>
    </ul>
  </nav>
</div>

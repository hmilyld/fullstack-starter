<script lang="ts">
  import type { Snippet } from "svelte"
  import { X } from "@lucide/svelte"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import { Separator } from "#lib/components/ui/separator/index.js"

  let {
    count,
    entityName,
    onClear,
    children,
  }: {
    count: number
    entityName: string
    onClear: () => void
    children?: Snippet
  } = $props()

  let bar = $state<HTMLElement | null>(null)
  let announcement = $state("")
  let timer: ReturnType<typeof setTimeout> | undefined

  $effect(() => {
    const nextCount = count
    clearTimeout(timer)
    if (nextCount === 0) {
      announcement = ""
      return
    }
    announcement = `已选中 ${nextCount} ${entityName}，批量操作可用`
    timer = setTimeout(() => {
      announcement = ""
    }, 3000)
    return () => clearTimeout(timer)
  })

  function isInsideOverlay(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false
    return Boolean(
      target.closest(
        '[role="dialog"], [data-slot="dropdown-menu-content"], [data-slot="select-content"]'
      )
    )
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || count === 0) return
    if (isInsideOverlay(event.target)) return
    onClear()
  }

  function handleBarKeyDown(event: KeyboardEvent) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
    const buttons = Array.from(
      bar?.querySelectorAll<HTMLButtonElement>("button") ?? []
    ).filter((button) => !button.disabled)
    if (buttons.length === 0) return

    event.preventDefault()
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (event.key === "ArrowRight") next = (current + 1) % buttons.length
    else if (event.key === "ArrowLeft")
      next = current <= 0 ? buttons.length - 1 : current - 1
    else if (event.key === "End") next = buttons.length - 1
    buttons[next]?.focus()
  }
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

<div aria-live="polite" aria-atomic="true" class="sr-only">
  {announcement}
</div>

{#if count > 0}
  <div
    bind:this={bar}
    role="toolbar"
    aria-label={`批量操作，已选 ${count} ${entityName}`}
    tabindex="-1"
    class="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 pb-[env(safe-area-inset-bottom)] md:bottom-6"
    onkeydown={handleBarKeyDown}
  >
    <div
      class="flex animate-in items-center gap-2 rounded-xl border bg-background/95 p-1.5 shadow-xl backdrop-blur-lg duration-200 ease-out fade-in-0 slide-in-from-bottom-2 supports-[backdrop-filter]:bg-background/70"
    >
      <Button
        variant="ghost"
        size="icon-xs"
        class="rounded-full"
        aria-label="清除选择"
        title="清除选择（Esc）"
        onclick={onClear}
      >
        <X />
      </Button>
      <Separator orientation="vertical" class="h-5" aria-hidden="true" />
      <span class="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <Badge class="min-w-6 justify-center rounded-md px-1.5 tabular-nums">
          {count}
        </Badge>
        <span class="text-muted-foreground">{entityName}</span>
      </span>
      {#if children}
        <Separator orientation="vertical" class="h-5" aria-hidden="true" />
        {@render children()}
      {/if}
    </div>
  </div>
{/if}

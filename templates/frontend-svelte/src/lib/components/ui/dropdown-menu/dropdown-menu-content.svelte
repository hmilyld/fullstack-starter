<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui"
  import { cn, type WithoutChildrenOrChild } from "#lib/utils.js"
  import DropdownMenuPortal from "./dropdown-menu-portal.svelte"
  import type { ComponentProps } from "svelte"

  let {
    ref = $bindable(null),
    sideOffset = 4,
    align = "start",
    // 非模态：锁定 body 滚动会让页面顶部的 sticky header 脱离视口
    preventScroll = false,
    onCloseAutoFocus,
    portalProps,
    class: className,
    ...restProps
  }: DropdownMenuPrimitive.ContentProps & {
    portalProps?: WithoutChildrenOrChild<
      ComponentProps<typeof DropdownMenuPortal>
    >
  } = $props()

  // bits-ui 不暴露触发器，关闭时按打开前获得焦点的 trigger 恢复焦点
  let restoreTarget = $state<HTMLElement | null>(null)
  $effect(() => {
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      active.hasAttribute("data-dropdown-menu-trigger")
    ) {
      restoreTarget = active
    }
    const record = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const trigger = target.closest<HTMLElement>(
        "[data-dropdown-menu-trigger]"
      )
      if (trigger) restoreTarget = trigger
    }
    document.addEventListener("focusin", record, true)
    return () => document.removeEventListener("focusin", record, true)
  })

  /**
   * bits-ui restores focus to the trigger with a plain `focus()`, and a trigger
   * inside a sticky header then scrolls the page back to the top (the browser
   * uses its static position). Return focus ourselves without scrolling, and
   * leave it alone when the menu was closed by clicking outside.
   */
  function handleCloseAutoFocus(event: Event) {
    onCloseAutoFocus?.(event)
    if (event.defaultPrevented) return
    event.preventDefault()
    const trigger = restoreTarget
    if (!trigger?.isConnected) return
    const active = document.activeElement
    const focusWasInside =
      !active ||
      active === document.body ||
      active === trigger ||
      (active instanceof Element &&
        active.closest('[data-slot="dropdown-menu-content"]') !== null)
    if (!focusWasInside) return
    trigger.focus({ preventScroll: true })
  }
</script>

<DropdownMenuPortal {...portalProps}>
  <DropdownMenuPrimitive.Content
    bind:ref
    data-slot="dropdown-menu-content"
    {sideOffset}
    {align}
    {preventScroll}
    onCloseAutoFocus={handleCloseAutoFocus}
    class={cn(
      "z-50 max-h-(--bits-dropdown-menu-content-available-height) w-(--bits-dropdown-menu-anchor-width) min-w-32 origin-(--bits-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
      className
    )}
    {...restProps}
  />
</DropdownMenuPortal>

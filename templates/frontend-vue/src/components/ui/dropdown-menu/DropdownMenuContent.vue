<script setup lang="ts">
import type {
  DropdownMenuContentEmits,
  DropdownMenuContentProps,
} from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "@/lib/utils"
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  injectDropdownMenuRootContext,
  useForwardPropsEmits,
} from "reka-ui"

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<DropdownMenuContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    align: "start",
    sideOffset: 4,
  }
)
const emits = defineEmits<DropdownMenuContentEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const rootContext = injectDropdownMenuRootContext()

/**
 * reka-ui restores focus to the trigger with a plain `focus()`, and a trigger
 * inside a sticky header then scrolls the page back to the top (the browser
 * uses its static position). Return focus ourselves without scrolling, and
 * leave it alone when the menu was closed by clicking outside.
 */
function handleCloseAutoFocus(event: Event) {
  if (event.defaultPrevented) return
  event.preventDefault()
  const trigger = rootContext?.triggerElement?.value
  if (!trigger) return
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

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      data-slot="dropdown-menu-content"
      v-bind="{ ...$attrs, ...forwarded }"
      @close-auto-focus="handleCloseAutoFocus"
      :class="
        cn(
          'z-50 max-h-(--reka-dropdown-menu-content-available-height) w-(--reka-dropdown-menu-trigger-width) min-w-32 origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          props.class
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>

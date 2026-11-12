<script setup lang="ts">
import type { HTMLAttributes, Ref } from "vue"
import {
  defaultDocument,
  useEventListener,
  useMediaQuery,
  useVModel,
} from "@vueuse/core"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "reka-ui"
import { computed, onScopeDispose, ref } from "vue"
import {
  provideSidebarContext,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_MOBILE_BREAKPOINT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from "./utils"

const props = withDefaults(
  defineProps<{
    defaultOpen?: boolean
    open?: boolean
    class?: HTMLAttributes["class"]
  }>(),
  {
    defaultOpen: true,
    open: undefined,
  }
)

function getStoredOpen(): boolean | undefined {
  const cookie = defaultDocument?.cookie ?? ""
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${SIDEBAR_COOKIE_NAME}=([^;]+)`)
  )
  if (!match) return undefined
  return match[1] === "true"
}

const storedOpen = getStoredOpen()

const emits = defineEmits<{
  "update:open": [open: boolean]
}>()

const isMobile = useMediaQuery(
  `(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`
)
const openMobile = ref(false)

// 平板及以下默认收起：低于 1280 时忽略上次保存的展开状态
const isTabletViewport =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1279px)").matches

const open = useVModel(props, "open", emits, {
  defaultValue: isTabletViewport ? false : (storedOpen ?? props.defaultOpen),
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

function setOpen(value: boolean) {
  open.value = value // emits('update:open', value)

  // This sets the cookie to keep the sidebar state.
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

// 跨断点收起：从 ≥1280 缩到平板宽度时不再占 256px。
// 不写 cookie，保留桌面上「展开」的偏好，回到宽屏仍然展开。
const tabletQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(max-width: 1279px)")
    : null
const handleTabletChange = (event: MediaQueryListEvent) => {
  if (!event.matches) return
  open.value = false
}
tabletQuery?.addEventListener("change", handleTabletChange)
onScopeDispose(() =>
  tabletQuery?.removeEventListener("change", handleTabletChange)
)

// Helper to toggle the sidebar.
function toggleSidebar() {
  return isMobile.value
    ? setOpenMobile(!openMobile.value)
    : setOpen(!open.value)
}

useEventListener("keydown", (event: KeyboardEvent) => {
  if (
    event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
    (event.metaKey || event.ctrlKey)
  ) {
    event.preventDefault()
    toggleSidebar()
  }
})

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
const state = computed(() => (open.value ? "expanded" : "collapsed"))

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="
        cn(
          'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
          props.class
        )
      "
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>

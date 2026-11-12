<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { CornerDownLeft, Search } from "@lucide/vue"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCommandMenu } from "@/composables/use-command-menu"
import { useNavigation } from "@/composables/use-navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { useAuthStore } from "@/stores/auth"
import { useThemeStore } from "@/stores/theme"

type CommandEntry = {
  id: string
  group: string
  title: string
  /** 跳转地址；与 run 二选一 */
  url?: string
  /** 直接执行的动作，如切换主题 */
  run?: () => void
  /** 右侧提示，默认显示 url */
  hint?: string
}

const RECENT_KEY = "command-recent"
const RECENT_LIMIT = 5

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : []
  } catch {
    return []
  }
}

function rememberRecent(pathname: string) {
  if (!pathname || pathname === "/login" || pathname === "/register") return
  try {
    const next = [
      pathname,
      ...readRecent().filter((value) => value !== pathname),
    ].slice(0, RECENT_LIMIT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式下不可写，忽略
  }
}

const EXTRA_ENTRIES: CommandEntry[] = [
  { id: "profile", group: "账户", title: "个人设置", url: "/settings/profile" },
]

const { open } = useCommandMenu()
const { groups, load } = useNavigation()
const auth = useAuthStore()
const themeStore = useThemeStore()
const { toggleSidebar } = useSidebar()
const router = useRouter()
const route = useRoute()

watch(
  () => route.path,
  (pathname) => rememberRecent(pathname),
  { immediate: true }
)

const query = ref("")
const activeIndex = ref(0)
const inputRef = ref<{ $el?: HTMLElement } | null>(null)

const entries = computed<CommandEntry[]>(() => {
  const navEntries = groups.value.flatMap((group) =>
    group.items.map((item) => ({
      id: `${group.id}-${item.permissionCode}`,
      group: group.name,
      title: item.name,
      url: item.route,
    }))
  )
  const extra = auth.hasPermission("permissions")
    ? [
        ...EXTRA_ENTRIES,
        {
          id: "permission-overview",
          group: "账户",
          title: "权限总览",
          url: "/settings/permission",
        },
      ]
    : EXTRA_ENTRIES

  const themeSuffix = (value: string) =>
    themeStore.theme === value ? "（当前）" : ""
  const actions: CommandEntry[] = [
    {
      id: "theme-light",
      group: "外观",
      title: `切换为浅色主题${themeSuffix("light")}`,
      hint: "主题",
      run: () => themeStore.setTheme("light"),
    },
    {
      id: "theme-dark",
      group: "外观",
      title: `切换为深色主题${themeSuffix("dark")}`,
      hint: "主题",
      run: () => themeStore.setTheme("dark"),
    },
    {
      id: "theme-system",
      group: "外观",
      title: `跟随系统主题${themeSuffix("system")}`,
      hint: "主题",
      run: () => themeStore.setTheme("system"),
    },
    {
      id: "sidebar-toggle",
      group: "外观",
      title: "收起 / 展开侧边栏",
      hint: "布局",
      run: toggleSidebar,
    },
  ]

  const base = [...navEntries, ...extra, ...actions]
  const recentUrls = readRecent().filter((url) => url !== route.path)
  const recent = recentUrls
    .map((url) => base.find((entry) => entry.url === url))
    .filter((entry): entry is CommandEntry => Boolean(entry))
    .map((entry) => ({
      ...entry,
      id: `recent-${entry.id}`,
      group: "最近",
    }))

  return [
    ...recent,
    ...base.filter((entry) => !recent.some((item) => item.url === entry.url)),
  ]
})

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return entries.value
  return entries.value.filter(
    (entry) =>
      entry.title.toLowerCase().includes(keyword) ||
      entry.hint?.toLowerCase().includes(keyword) ||
      entry.url?.toLowerCase().includes(keyword)
  )
})

const activeOptionId = computed(() =>
  results.value[activeIndex.value]
    ? `command-option-${activeIndex.value}`
    : undefined
)

function select(entry: CommandEntry) {
  open.value = false
  if (entry.run) {
    entry.run()
    return
  }
  if (entry.url) void router.push(entry.url)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault()
    activeIndex.value = Math.min(
      activeIndex.value + 1,
      results.value.length - 1
    )
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === "Enter") {
    event.preventDefault()
    const entry = results.value[activeIndex.value]
    if (entry) select(entry)
  }
}

function handleShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault()
    open.value = !open.value
  }
}

watch(open, async (value) => {
  if (!value) return
  query.value = ""
  activeIndex.value = 0
  await load()
  await nextTick()
  const element = inputRef.value?.$el
  const input = element?.querySelector?.("input") ?? element
  input?.focus?.()
})

watch(query, () => {
  activeIndex.value = 0
})

onMounted(() => {
  window.addEventListener("keydown", handleShortcut)
  void load()
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleShortcut)
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="top-[12%] max-h-[70svh] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
    >
      <DialogTitle class="sr-only">快速查找</DialogTitle>
      <DialogDescription class="sr-only">
        搜索页面、菜单或外观操作
      </DialogDescription>
      <div class="flex items-center gap-2 border-b px-3">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref="inputRef"
          v-model="query"
          name="command-search"
          autocomplete="off"
          spellcheck="false"
          placeholder="搜索页面或菜单…"
          aria-label="搜索页面或菜单"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-menu-list"
          aria-autocomplete="list"
          :aria-activedescendant="activeOptionId"
          class="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          @keydown="handleKeydown"
        />
        <kbd
          class="rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          Esc
        </kbd>
      </div>

      <span class="sr-only" aria-live="polite">
        {{ results.length }} 个结果
      </span>
      <div
        id="command-menu-list"
        role="listbox"
        aria-label="搜索结果"
        class="max-h-[46svh] overflow-y-auto overscroll-contain p-2"
      >
        <p
          v-if="results.length === 0"
          class="px-3 py-8 text-center text-sm text-muted-foreground"
        >
          没有匹配的页面，换个关键词试试。
        </p>
        <template v-else>
          <template v-for="(entry, index) in results" :key="entry.id">
            <p
              v-if="index === 0 || results[index - 1].group !== entry.group"
              class="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground"
            >
              {{ entry.group }}
            </p>
            <div
              role="option"
              :id="`command-option-${index}`"
              :aria-selected="index === activeIndex"
              :class="[
                'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors outline-none',
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground/80 hover:bg-accent/60',
              ]"
              @click="select(entry)"
              @mousemove="activeIndex = index"
            >
              <span class="truncate">{{ entry.title }}</span>
              <span
                class="shrink-0 font-mono text-[11px] text-muted-foreground"
              >
                {{ entry.url ?? entry.hint }}
              </span>
            </div>
          </template>
        </template>
      </div>

      <div
        class="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground"
      >
        <span class="flex items-center gap-1">
          <kbd class="rounded-sm border px-1 py-0.5 font-mono">↑</kbd>
          <kbd class="rounded-sm border px-1 py-0.5 font-mono">↓</kbd>
          选择
        </span>
        <span class="flex items-center gap-1">
          <CornerDownLeft class="size-3" />
          打开
        </span>
        <span class="ml-auto">⌘K 随时唤起</span>
      </div>
    </DialogContent>
  </Dialog>
</template>

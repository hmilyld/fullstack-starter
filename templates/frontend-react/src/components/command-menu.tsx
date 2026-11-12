import * as React from "react"
import { useNavigate } from "react-router"
import { CornerDownLeftIcon, SearchIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSidebar } from "@/components/ui/sidebar"
import { useNavigation } from "@/hooks/use-navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const COMMAND_MENU_EVENT = "command-menu-open"

/** 顶栏、侧边栏底部与快捷键共用的入口 */
export function openCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT))
}

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

const EXTRA_ENTRIES: CommandEntry[] = [
  { id: "profile", group: "账户", title: "个人设置", url: "/settings/profile" },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const navigate = useNavigate()
  const { groups } = useNavigation()
  const { hasPermission } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const listRef = React.useRef<HTMLDivElement>(null)

  const entries = React.useMemo<CommandEntry[]>(() => {
    const navEntries = groups.flatMap((group) =>
      group.items.map((item) => ({
        id: `${group.id}-${item.permissionCode}`,
        group: group.name,
        title: item.name,
        url: item.route,
      }))
    )
    const extra = hasPermission("permissions")
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

    const themeSuffix = (value: string) => (theme === value ? "（当前）" : "")
    const actions: CommandEntry[] = [
      {
        id: "theme-light",
        group: "外观",
        title: `切换为浅色主题${themeSuffix("light")}`,
        hint: "主题",
        run: () => setTheme("light"),
      },
      {
        id: "theme-dark",
        group: "外观",
        title: `切换为深色主题${themeSuffix("dark")}`,
        hint: "主题",
        run: () => setTheme("dark"),
      },
      {
        id: "theme-system",
        group: "外观",
        title: `跟随系统主题${themeSuffix("system")}`,
        hint: "主题",
        run: () => setTheme("system"),
      },
      {
        id: "sidebar-toggle",
        group: "外观",
        title: "收起 / 展开侧边栏",
        hint: "布局",
        run: toggleSidebar,
      },
    ]

    return [...navEntries, ...extra, ...actions]
  }, [groups, hasPermission, theme, setTheme, toggleSidebar])

  const results = React.useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return entries
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(keyword) ||
        entry.hint?.toLowerCase().includes(keyword) ||
        entry.url?.toLowerCase().includes(keyword)
    )
  }, [entries, query])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    function handleOpen() {
      setOpen(true)
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener(COMMAND_MENU_EVENT, handleOpen)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener(COMMAND_MENU_EVENT, handleOpen)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    setQuery("")
    setActiveIndex(0)
  }, [open])

  React.useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${activeIndex}"]`
    )
    node?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  function select(entry: CommandEntry) {
    setOpen(false)
    if (entry.run) {
      entry.run()
      return
    }
    if (entry.url) navigate(entry.url)
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const entry = results[activeIndex]
      if (entry) select(entry)
    }
  }

  const activeOptionId = results[activeIndex]
    ? `command-option-${activeIndex}`
    : undefined

  let lastGroup = ""

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-h-[70svh] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">快速查找</DialogTitle>
        <DialogDescription className="sr-only">
          搜索页面、菜单或外观操作
        </DialogDescription>
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            name="command-search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索页面或菜单…"
            aria-label="搜索页面或菜单"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-menu-list"
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            className="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <kbd className="rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        <span className="sr-only" aria-live="polite">
          {results.length} 个结果
        </span>
        <div
          ref={listRef}
          id="command-menu-list"
          role="listbox"
          aria-label="搜索结果"
          className="max-h-[46svh] overflow-y-auto overscroll-contain p-2"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              没有匹配的页面，换个关键词试试。
            </p>
          ) : (
            results.map((entry, index) => {
              const showGroup = entry.group !== lastGroup
              lastGroup = entry.group
              return (
                <React.Fragment key={entry.id}>
                  {showGroup && (
                    <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                      {entry.group}
                    </p>
                  )}
                  <div
                    role="option"
                    id={`command-option-${index}`}
                    aria-selected={index === activeIndex}
                    data-command-index={index}
                    onClick={() => select(entry)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors outline-none",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80 hover:bg-accent/60"
                    )}
                  >
                    <span className="truncate">{entry.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {entry.url ?? entry.hint}
                    </span>
                  </div>
                </React.Fragment>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded-sm border px-1 py-0.5 font-mono">↑</kbd>
            <kbd className="rounded-sm border px-1 py-0.5 font-mono">↓</kbd>
            选择
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeftIcon className="size-3" />
            打开
          </span>
          <span className="ml-auto">⌘K 随时唤起</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

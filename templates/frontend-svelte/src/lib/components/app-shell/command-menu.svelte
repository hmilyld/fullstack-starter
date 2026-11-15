<script lang="ts">
  import { tick } from "svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { CornerDownLeft, Search } from "@lucide/svelte"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
  } from "#lib/components/ui/dialog/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { t } from "#lib/i18n.js"
  import { useCommandMenu } from "#lib/hooks/use-command-menu.svelte.js"
  import { useNavigation } from "#lib/hooks/use-navigation.svelte.js"
  import { useSidebar } from "#lib/components/ui/sidebar/index.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { getTheme, setTheme } from "#lib/stores/theme.svelte.js"

  type CommandEntry = {
    id: string
    group: string
    title: string
    url?: string
    run?: () => void
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
    {
      id: "profile",
      group: "account",
      title: "profile",
      url: "/settings/profile",
    },
  ]

  const cm = useCommandMenu()
  const navigation = useNavigation()
  const sidebar = useSidebar()

  let query = $state("")
  let activeIndex = $state(0)

  $effect(() => {
    rememberRecent(page.url.pathname)
  })

  const entries = $derived.by(() => {
    const navEntries: CommandEntry[] = navigation.groups.flatMap((group) =>
      group.items.map((item) => ({
        id: `${group.id}-${item.permissionCode}`,
        group: $t(`nav.groups.${group.id}`, { defaultValue: group.name }),
        title: $t(`nav.items.${item.permissionCode}`, {
          defaultValue: item.name,
        }),
        url: item.route,
      }))
    )
    const extra: CommandEntry[] = (
      auth.hasPermission("permissions")
        ? [
            ...EXTRA_ENTRIES,
            {
              id: "permission-overview",
              group: "account",
              title: "permissions",
              url: "/settings/permission",
            },
          ]
        : EXTRA_ENTRIES
    ).map((entry) => ({
      ...entry,
      group: $t(`commandMenu.groups.${entry.group}`),
      title: $t(`commandMenu.actions.${entry.title}`),
    }))

    const themeSuffix = (value: string) =>
      getTheme() === value ? $t("commandMenu.actions.current") : ""
    const actions: CommandEntry[] = [
      {
        id: "theme-light",
        group: $t("commandMenu.groups.appearance"),
        title: `${$t("commandMenu.actions.themeLight")}${themeSuffix("light")}`,
        hint: $t("commandMenu.hints.theme"),
        run: () => setTheme("light"),
      },
      {
        id: "theme-dark",
        group: $t("commandMenu.groups.appearance"),
        title: `${$t("commandMenu.actions.themeDark")}${themeSuffix("dark")}`,
        hint: $t("commandMenu.hints.theme"),
        run: () => setTheme("dark"),
      },
      {
        id: "theme-system",
        group: $t("commandMenu.groups.appearance"),
        title: `${$t("commandMenu.actions.themeSystem")}${themeSuffix("system")}`,
        hint: $t("commandMenu.hints.theme"),
        run: () => setTheme("system"),
      },
      {
        id: "sidebar-toggle",
        group: $t("commandMenu.groups.appearance"),
        title: $t("commandMenu.actions.sidebarToggle"),
        hint: $t("commandMenu.hints.layout"),
        run: sidebar.toggle,
      },
    ]

    const base = [...navEntries, ...extra, ...actions]
    const recentUrls = readRecent().filter((url) => url !== page.url.pathname)
    const recent = recentUrls
      .map((url) => base.find((entry) => entry.url === url))
      .filter((entry): entry is CommandEntry => Boolean(entry))
      .map((entry) => ({
        ...entry,
        id: `recent-${entry.id}`,
        group: $t("commandMenu.groups.recent"),
      }))

    return [
      ...recent,
      ...base.filter((entry) => !recent.some((item) => item.url === entry.url)),
    ]
  })

  const results = $derived.by(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return entries
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(keyword) ||
        entry.hint?.toLowerCase().includes(keyword) ||
        entry.url?.toLowerCase().includes(keyword)
    )
  })

  const activeOptionId = $derived(
    results[activeIndex] ? `command-option-${activeIndex}` : undefined
  )

  $effect(() => {
    if (!cm.open) return
    query = ""
    activeIndex = 0
    void navigation.load()
    void tick().then(() => {
      document
        .querySelector<HTMLInputElement>('input[name="command-search"]')
        ?.focus()
    })
  })

  $effect(() => {
    void query
    activeIndex = 0
  })

  function select(entry: CommandEntry) {
    cm.setOpen(false)
    if (entry.run) {
      entry.run()
      return
    }
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- 菜单路由来自后端，运行时才能确定
    if (entry.url) void goto(entry.url)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      activeIndex = Math.min(activeIndex + 1, results.length - 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      activeIndex = Math.max(activeIndex - 1, 0)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const entry = results[activeIndex]
      if (entry) select(entry)
    }
  }

  function handleShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      cm.setOpen(!cm.open)
    }
  }
</script>

<svelte:window onkeydown={handleShortcut} />

<Dialog open={cm.open} onOpenChange={cm.setOpen}>
  <DialogContent
    showCloseButton={false}
    class="top-[12%] max-h-[70svh] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
  >
    <DialogTitle class="sr-only">{$t("commandMenu.title")}</DialogTitle>
    <DialogDescription class="sr-only">
      {$t("commandMenu.description")}
    </DialogDescription>
    <div class="flex items-center gap-2 border-b px-3">
      <Search class="size-4 shrink-0 text-muted-foreground" />
      <Input
        bind:value={query}
        name="command-search"
        autocomplete="off"
        spellcheck="false"
        placeholder={$t("commandMenu.placeholder")}
        aria-label={$t("commandMenu.searchAria")}
        role="combobox"
        aria-expanded="true"
        aria-controls="command-menu-list"
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        class="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        onkeydown={handleKeydown}
      />
      <kbd
        class="rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
      >
        Esc
      </kbd>
    </div>

    <span class="sr-only" aria-live="polite">
      {$t("commandMenu.results", { count: results.length })}
    </span>
    <div
      id="command-menu-list"
      role="listbox"
      aria-label={$t("commandMenu.resultsAria")}
      class="max-h-[46svh] overflow-y-auto overscroll-contain p-2"
    >
      {#if results.length === 0}
        <p class="px-3 py-8 text-center text-sm text-muted-foreground">
          {$t("commandMenu.empty")}
        </p>
      {:else}
        {#each results as entry, index (entry.id)}
          {#if index === 0 || results[index - 1].group !== entry.group}
            <p class="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              {entry.group}
            </p>
          {/if}
          <div
            role="option"
            tabindex="-1"
            id={`command-option-${index}`}
            aria-selected={index === activeIndex}
            class={[
              "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors outline-none",
              index === activeIndex
                ? "bg-accent text-accent-foreground"
                : "text-foreground/80 hover:bg-accent/60",
            ]}
            onclick={() => select(entry)}
            onkeydown={(event) => {
              if (event.key === "Enter") select(entry)
            }}
            onmousemove={() => (activeIndex = index)}
          >
            <span class="truncate">{entry.title}</span>
            <span class="shrink-0 font-mono text-[11px] text-muted-foreground">
              {entry.url ?? entry.hint}
            </span>
          </div>
        {/each}
      {/if}
    </div>

    <div
      class="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground"
    >
      <span class="flex items-center gap-1">
        <kbd class="rounded-sm border px-1 py-0.5 font-mono">↑</kbd>
        <kbd class="rounded-sm border px-1 py-0.5 font-mono">↓</kbd>
        {$t("commandMenu.footer.select")}
      </span>
      <span class="flex items-center gap-1">
        <CornerDownLeft class="size-3" />
        {$t("commandMenu.footer.open")}
      </span>
      <span class="ml-auto">{$t("commandMenu.footer.shortcut")}</span>
    </div>
  </DialogContent>
</Dialog>

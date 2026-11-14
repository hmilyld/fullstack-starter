<script lang="ts">
  /* eslint-disable svelte/prefer-svelte-reactivity -- Set/Map/Date 只用于不可变副本或纯计算，不承载响应式状态 */
  import { ChevronRight, Search } from "@lucide/svelte"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import { Checkbox } from "#lib/components/ui/checkbox/index.js"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "#lib/components/ui/table/index.js"
  import { useMediaQuery } from "#lib/hooks/use-media-query.svelte.js"
  import {
    buildPermissionTree,
    filterPermissionTree,
    permissionNameKey,
  } from "#lib/access-tree.js"
  import { t } from "#lib/i18n.js"
  import { cn } from "#lib/utils.js"
  import type { Permission } from "#lib/types/permission.js"

  let {
    menuPermissions,
    operationPermissions,
    value = $bindable<string[]>([]),
    loading,
    error,
    onRetry,
  }: {
    menuPermissions: Permission[]
    operationPermissions: Permission[]
    value?: string[]
    loading: boolean
    error: string | null
    onRetry: () => void
  } = $props()

  type CheckedState = boolean | "indeterminate"

  const isCompact = useMediaQuery("(max-width: 767px)")
  let search = $state("")
  let collapsed = $state<Set<string>>(new Set())

  const childrenByMenu = $derived.by(() => {
    const map = new Map<string, Permission[]>()
    for (const operation of operationPermissions) {
      if (!operation.parent) continue
      const list = map.get(operation.parent) ?? []
      list.push(operation)
      map.set(operation.parent, list)
    }
    return map
  })

  const catalogCodes = $derived(
    new Set([
      ...menuPermissions.map((permission) => permission.code),
      ...operationPermissions.map((permission) => permission.code),
    ])
  )

  const selected = $derived(new Set(value))
  const selectedCount = $derived(
    [...selected].filter((code) => catalogCodes.has(code)).length
  )

  const tree = $derived(
    filterPermissionTree(
      buildPermissionTree(menuPermissions, operationPermissions).map(
        (node) => ({
          ...node,
          name: $t(permissionNameKey(node.code), { defaultValue: node.name }),
          children: node.children.map((child) => ({
            ...child,
            name: $t(permissionNameKey(child.code), {
              defaultValue: child.name,
            }),
          })),
        })
      ),
      search
    )
  )

  $effect(() => {
    void search
    collapsed = new Set()
  })

  function childrenOf(code: string) {
    return childrenByMenu.get(code) ?? []
  }

  function menuState(menu: Permission): CheckedState {
    const children = childrenOf(menu.code)
    const selectedChildren = children.filter((child) =>
      selected.has(child.code)
    ).length
    const menuSelected = selected.has(menu.code)

    if (children.length === 0) return menuSelected
    // 只授予菜单本身（未选任何操作）时仍视为已勾选，点击即取消。
    if (menuSelected && selectedChildren === 0) return true
    if (menuSelected && selectedChildren === children.length) return true
    if (menuSelected || selectedChildren > 0) return "indeterminate"
    return false
  }

  function menuCountLabel(code: string) {
    const children = childrenOf(code)
    if (children.length === 0) return $t("rolePermissions.noOperations")
    const checked = children.filter((child) => selected.has(child.code)).length
    return $t("rolePermissions.operationCount", {
      checked,
      total: children.length,
    })
  }

  function toggleCollapsed(code: string) {
    const next = new Set(collapsed)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    collapsed = next
  }

  function toggleMenu(menu: Permission) {
    if (menuState(menu) === true) {
      const childCodes = new Set(
        childrenOf(menu.code).map((child) => child.code)
      )
      value = value.filter(
        (code) => code !== menu.code && !childCodes.has(code)
      )
      return
    }

    const next = new Set(value)
    next.add(menu.code)
    for (const child of childrenOf(menu.code)) next.add(child.code)
    value = [...next]
  }

  function toggleOperation(operation: Permission) {
    const next = new Set(value)
    if (next.has(operation.code)) {
      next.delete(operation.code)
    } else {
      next.add(operation.code)
      // 授予操作权限时同时授予其所属菜单，避免出现无入口的孤儿权限。
      if (operation.parent) next.add(operation.parent)
    }
    value = [...next]
  }

  function selectAll() {
    value = [...catalogCodes]
  }

  function clearAll() {
    value = []
  }
</script>

<div class="flex flex-col gap-3">
  {#if loading}
    <div
      class="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground"
    >
      {$t("rolePermissions.loading")}
    </div>
  {:else if error}
    <div class="flex flex-col items-start gap-2 rounded-xl border p-4 text-sm">
      <span class="text-destructive">{error}</span>
      <Button type="button" variant="outline" size="sm" onclick={onRetry}>
        {$t("common.retry")}
      </Button>
    </div>
  {:else if menuPermissions.length === 0}
    <div
      class="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground"
    >
      {$t("rolePermissions.empty")}
    </div>
  {:else}
    <p class="text-xs text-muted-foreground">
      {$t("rolePermissions.hint")}
    </p>

    <div
      class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="permission-q"
          autocomplete="off"
          spellcheck={false}
          placeholder={$t("rolePermissions.searchPlaceholder")}
          aria-label={$t("rolePermissions.searchAria")}
          bind:value={search}
          onkeydown={(event) => {
            if (event.key === "Enter" && !event.isComposing)
              event.preventDefault()
          }}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

      <div class="flex items-center justify-between gap-2 md:justify-end">
        <span class="text-xs text-muted-foreground" aria-live="polite">
          {$t("rolePermissions.selected", {
            selected: selectedCount,
            total: catalogCodes.size,
          })}
        </span>
        <div class="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            class="max-md:h-11"
            disabled={catalogCodes.size === 0}
            onclick={selectAll}
          >
            {$t("rolePermissions.selectAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            class="max-md:h-11"
            disabled={selectedCount === 0}
            onclick={clearAll}
          >
            {$t("rolePermissions.clear")}
          </Button>
        </div>
      </div>
    </div>

    {#if tree.length === 0}
      <div
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground"
      >
        <span>{$t("rolePermissions.noMatches")}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => (search = "")}
        >
          {$t("rolePermissions.clearSearch")}
        </Button>
      </div>
    {:else if isCompact.matches}
      <div
        class="flex max-h-[min(50vh,440px)] scroll-pt-10 flex-col gap-2 overflow-y-auto overscroll-contain pr-1"
      >
        {#each tree as menu (menu.code)}
          <div class="rounded-xl border bg-card">
            <div class="flex items-start gap-2 p-3">
              <Checkbox
                id={`role-permission-menu-${menu.code}`}
                class="mt-0.5"
                aria-label={$t("rolePermissions.selectMenu", {
                  name: menu.name,
                })}
                checked={menuState(menu) === true}
                indeterminate={menuState(menu) === "indeterminate"}
                onCheckedChange={() => toggleMenu(menu)}
              />
              <label
                for={`role-permission-menu-${menu.code}`}
                class="min-w-0 flex-1 cursor-pointer"
              >
                <span class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span class="truncate text-sm font-medium">{menu.name}</span>
                  <span class="text-xs text-muted-foreground">
                    {menuCountLabel(menu.code)}
                  </span>
                </span>
                <span
                  class="block truncate font-mono text-[11px] text-muted-foreground"
                >
                  {menu.code}
                </span>
              </label>
              {#if childrenOf(menu.code).length > 0}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  class="shrink-0"
                  aria-expanded={!collapsed.has(menu.code)}
                  aria-label={$t(
                    collapsed.has(menu.code)
                      ? "rolePermissions.expandAria"
                      : "rolePermissions.collapseAria",
                    { name: menu.name }
                  )}
                  onclick={() => toggleCollapsed(menu.code)}
                >
                  <ChevronRight
                    class={cn(
                      "transition-transform",
                      !collapsed.has(menu.code) && "rotate-90"
                    )}
                  />
                </Button>
              {/if}
            </div>

            {#if !collapsed.has(menu.code) && menu.children.length > 0}
              <div class="flex flex-col gap-1 border-t p-2">
                {#each menu.children as operation (operation.code)}
                  <div class="flex items-start gap-3 rounded-lg px-2 py-2.5">
                    <Checkbox
                      id={`role-permission-op-${operation.code}`}
                      class="mt-0.5"
                      aria-label={$t("rolePermissions.selectOperation", {
                        name: operation.name,
                      })}
                      checked={selected.has(operation.code)}
                      onCheckedChange={() => toggleOperation(operation)}
                    />
                    <label
                      for={`role-permission-op-${operation.code}`}
                      class="min-w-0 flex-1 cursor-pointer"
                    >
                      <span class="block truncate text-sm">
                        {operation.name}
                      </span>
                      <span
                        class="block truncate font-mono text-[11px] text-muted-foreground"
                      >
                        {operation.code}
                      </span>
                    </label>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="max-h-[min(50vh,440px)] scroll-pt-10 overflow-auto overscroll-contain rounded-xl border [&_[data-slot=table-container]]:overflow-visible"
      >
        <Table class="min-w-[520px]">
          <TableHeader class="sticky top-0 z-10 bg-muted">
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-[52%]"
                >{$t("rolePermissions.nameHeader")}</TableHead
              >
              <TableHead class="w-[33%]"
                >{$t("rolePermissions.codeHeader")}</TableHead
              >
              <TableHead class="w-[15%]"
                >{$t("rolePermissions.typeHeader")}</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each tree as menu (menu.code)}
              <TableRow class="bg-muted/40 hover:bg-muted/60">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      id={`role-permission-menu-${menu.code}`}
                      aria-label={$t("rolePermissions.selectMenu", {
                        name: menu.name,
                      })}
                      checked={menuState(menu) === true}
                      indeterminate={menuState(menu) === "indeterminate"}
                      onCheckedChange={() => toggleMenu(menu)}
                    />
                    {#if childrenOf(menu.code).length > 0}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-expanded={!collapsed.has(menu.code)}
                        aria-label={$t(
                          collapsed.has(menu.code)
                            ? "rolePermissions.expandAria"
                            : "rolePermissions.collapseAria",
                          { name: menu.name }
                        )}
                        onclick={() => toggleCollapsed(menu.code)}
                      >
                        <ChevronRight
                          class={cn(
                            "transition-transform",
                            !collapsed.has(menu.code) && "rotate-90"
                          )}
                        />
                      </Button>
                    {:else}
                      <span class="size-6 shrink-0" aria-hidden="true"></span>
                    {/if}
                    <label
                      for={`role-permission-menu-${menu.code}`}
                      class="min-w-0 cursor-pointer truncate text-sm font-medium"
                    >
                      {menu.name}
                    </label>
                    <span class="shrink-0 text-xs text-muted-foreground">
                      {menuCountLabel(menu.code)}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {menu.code}
                </TableCell>
                <TableCell
                  ><Badge>{$t("rolePermissions.menuType")}</Badge></TableCell
                >
              </TableRow>

              {#if !collapsed.has(menu.code)}
                {#each menu.children as operation (operation.code)}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-2 pl-8">
                        <Checkbox
                          id={`role-permission-op-${operation.code}`}
                          aria-label={$t("rolePermissions.selectOperation", {
                            name: operation.name,
                          })}
                          checked={selected.has(operation.code)}
                          onCheckedChange={() => toggleOperation(operation)}
                        />
                        <label
                          for={`role-permission-op-${operation.code}`}
                          class="min-w-0 cursor-pointer truncate text-sm"
                        >
                          {operation.name}
                        </label>
                      </div>
                    </TableCell>
                    <TableCell class="font-mono text-xs text-muted-foreground">
                      {operation.code}
                    </TableCell>
                    <TableCell
                      ><Badge variant="secondary"
                        >{$t("rolePermissions.operationType")}</Badge
                      ></TableCell
                    >
                  </TableRow>
                {/each}
              {/if}
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  {/if}
</div>

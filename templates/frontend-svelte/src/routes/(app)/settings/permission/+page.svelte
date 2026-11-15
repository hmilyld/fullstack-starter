<script lang="ts">
  import { onMount } from "svelte"
  import { SvelteSet } from "svelte/reactivity"
  import { ChevronRight, KeyRound, RefreshCw, Search } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import ErrorState from "#lib/components/shared/error-state.svelte"
  import InlineError from "#lib/components/shared/inline-error.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import TableSkeletonRow from "#lib/components/shared/table-skeleton-row.svelte"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
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
  import { getPermissions, syncPermissions } from "#lib/api/permission.js"
  import {
    buildPermissionTree,
    filterPermissionTree,
    permissionNameKey,
    type PermissionTreeNode,
  } from "#lib/access-tree.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { useUrlListState } from "#lib/hooks/use-url-list-state.svelte.js"
  import { t } from "#lib/i18n.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { cn } from "#lib/utils.js"
  import type { Permission } from "#lib/types/permission.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"

  const toast = useToast()
  const urlState = useUrlListState()
  const search = $derived(urlState.search)

  let menuPermissions = $state<Permission[]>([])
  let operationPermissions = $state<Permission[]>([])
  const expanded = new SvelteSet<string>()
  let tableLoading = $state(true)
  let error = $state<string | null>(null)
  let syncing = $state(false)

  async function loadData() {
    tableLoading = true
    error = null
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) menuPermissions = menuRes.data
    else error = menuRes.message || $t("permissionPage.loadMenuFailed")
    if (opRes.code === 0) operationPermissions = opRes.data
    else error = opRes.message || $t("permissionPage.loadOperationFailed")
    tableLoading = false
  }

  onMount(() => {
    void loadData()
  })

  const tree = $derived<PermissionTreeNode[]>(
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
    if (!search) return
    expanded.clear()
    for (const node of tree) expanded.add(node.code)
  })

  function toggleExpand(code: string) {
    if (expanded.has(code)) expanded.delete(code)
    else expanded.add(code)
  }

  async function handleSync() {
    syncing = true
    const res = await syncPermissions()
    syncing = false
    if (res.code !== 0) {
      toast.error(res.message || $t("permissionPage.syncFailed"))
      return
    }
    toast.success(
      $t("permissionPage.syncSuccess", {
        added: res.data.added.length,
        updated: res.data.updated.length,
        granted: res.data.granted.length,
      })
    )
    void loadData()
  }

  const hasPermissions = $derived(tree.length > 0)
</script>

<svelte:head
  ><title
    >{$t("permissionPage.title")} · {siteConfig.config?.siteName?.trim() ||
      $t("pwa.defaultName")}</title
  ></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title={$t("permissionPage.title")}
    description={$t("permissionPage.description")}
  >
    <Button href="/settings/menu" variant="outline">
      <KeyRound data-icon="inline-start" />
      {$t("permissionPage.menuLink")}
    </Button>
  </PageHeader>

  <ListShell
    description={$t("permissionPage.listDescription", {
      menus: menuPermissions.length,
      ops: operationPermissions.length,
    })}
  >
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder={$t("permissionPage.searchPlaceholder")}
          aria-label={$t("permissionPage.searchAria")}
          value={search}
          oninput={(event) => urlState.setSearch(event.currentTarget.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      {#if auth.hasPermission("permissions.create")}
        <LoadingButton
          variant="outline"
          loading={syncing}
          class="w-full md:w-auto"
          onclick={() => void handleSync()}
        >
          {#if !syncing}<RefreshCw data-icon="inline-start" />{/if}
          {$t("permissionPage.sync")}
        </LoadingButton>
      {/if}
    {/snippet}

    {#if error && hasPermissions}
      <InlineError message={error} onRetry={() => void loadData()} />
    {/if}

    {#if tableLoading}
      <TableSkeletonRow colSpan={3} />
    {:else if error && !hasPermissions}
      <ErrorState message={error} onRetry={() => void loadData()} />
    {:else if !hasPermissions}
      <EmptyState
        icon={KeyRound}
        title={search
          ? $t("permissionPage.emptySearchTitle")
          : $t("permissionPage.emptyTitle")}
        description={search
          ? $t("permissionPage.emptySearchDescription")
          : $t("permissionPage.emptyDescription")}
      >
        {#if search}
          <Button variant="outline" onclick={() => urlState.setSearch("")}>
            {$t("permissionPage.clearSearch")}
          </Button>
        {:else if auth.hasPermission("permissions")}
          <Button href="/settings/menu">{$t("permissionPage.goToMenus")}</Button
          >
        {/if}
      </EmptyState>
    {:else}
      <p class="px-1 text-xs text-muted-foreground">
        {$t("permissionPage.hiddenNote")}
      </p>

      <div class="flex flex-col gap-2 md:hidden">
        {#each tree as node (node.code)}
          <div class="rounded-2xl border bg-card">
            <div class="flex items-start justify-between gap-2 p-4">
              <div class="flex min-w-0 flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{node.name}</span>
                  <Badge variant="default"
                    >{$t("permissionPage.menuType")}</Badge
                  >
                </div>
                <code class="truncate text-xs text-muted-foreground">
                  {node.code}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={$t(
                  expanded.has(node.code)
                    ? "permissionPage.collapseAria"
                    : "permissionPage.expandAria",
                  { name: node.name }
                )}
                aria-expanded={expanded.has(node.code)}
                onclick={() => toggleExpand(node.code)}
              >
                <ChevronRight
                  class={cn(
                    "transition-transform",
                    expanded.has(node.code) && "rotate-90"
                  )}
                />
              </Button>
            </div>
            {#if expanded.has(node.code)}
              <div class="border-t p-2">
                {#each node.children as child (child.code)}
                  <div
                    class="flex items-start justify-between gap-2 rounded-xl px-2 py-2"
                  >
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <span class="truncate text-sm">{child.name}</span>
                      <code class="truncate text-xs text-muted-foreground">
                        {child.code}
                      </code>
                    </div>
                  </div>
                {/each}
                {#if node.children.length === 0}
                  <p class="px-2 py-3 text-sm text-muted-foreground">
                    {$t("permissionPage.noOperations")}
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[45%]"
                >{$t("permissionPage.nameHeader")}</TableHead
              >
              <TableHead class="w-[45%]"
                >{$t("permissionPage.codeHeader")}</TableHead
              >
              <TableHead class="w-[10%]"
                >{$t("permissionPage.typeHeader")}</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each tree as node (node.code)}
              <TableRow class="bg-muted/30">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-expanded={expanded.has(node.code)}
                      aria-label={$t(
                        expanded.has(node.code)
                          ? "permissionPage.collapseAria"
                          : "permissionPage.expandAria",
                        { name: node.name }
                      )}
                      onclick={() => toggleExpand(node.code)}
                    >
                      <ChevronRight
                        class={cn(
                          "transition-transform",
                          expanded.has(node.code) && "rotate-90"
                        )}
                      />
                    </Button>
                    <span class="font-medium">{node.name}</span>
                  </div>
                </TableCell>
                <TableCell class="font-mono text-sm">{node.code}</TableCell>
                <TableCell>
                  <Badge variant="default"
                    >{$t("permissionPage.menuType")}</Badge
                  >
                </TableCell>
              </TableRow>

              {#if expanded.has(node.code)}
                {#each node.children as child (child.code)}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-2 pl-9">
                        <span>{child.name}</span>
                      </div>
                    </TableCell>
                    <TableCell class="font-mono text-sm">
                      {child.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary"
                        >{$t("permissionPage.operationType")}</Badge
                      >
                    </TableCell>
                  </TableRow>
                {/each}
                {#if node.children.length === 0}
                  <TableRow>
                    <TableCell colspan={3}>
                      <div class="pl-9 text-sm text-muted-foreground">
                        {$t("permissionPage.noOperations")}
                      </div>
                    </TableCell>
                  </TableRow>
                {/if}
              {/if}
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </ListShell>
</div>

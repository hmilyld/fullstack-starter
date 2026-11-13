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
    type PermissionTreeNode,
  } from "#lib/access-tree.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { useUrlListState } from "#lib/hooks/use-url-list-state.svelte.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { cn } from "#lib/utils.js"
  import type { Permission } from "#lib/types/permission.js"

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
    else error = menuRes.message || "加载菜单权限失败"
    if (opRes.code === 0) operationPermissions = opRes.data
    else error = opRes.message || "加载操作权限失败"
    tableLoading = false
  }

  onMount(() => {
    void loadData()
  })

  const tree = $derived<PermissionTreeNode[]>(
    filterPermissionTree(
      buildPermissionTree(menuPermissions, operationPermissions),
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
      toast.error(res.message || "同步失败")
      return
    }
    toast.success(
      `同步成功：新增 ${res.data.added.length} 个，更新 ${res.data.updated.length} 个，管理员授予 ${res.data.granted.length} 个`
    )
    void loadData()
  }

  const hasPermissions = $derived(tree.length > 0)
</script>

<svelte:head><title>权限总览 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title="权限总览"
    description="只读查看菜单权限与操作权限；日常维护请前往菜单与权限。"
  >
    <Button href="/settings/menu" variant="outline">
      <KeyRound data-icon="inline-start" />
      菜单与权限
    </Button>
  </PageHeader>

  <ListShell
    description={`共 ${menuPermissions.length} 个菜单权限，${operationPermissions.length} 个操作权限`}
  >
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder="搜索编码或名称…"
          aria-label="搜索权限"
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
          同步权限
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
        title={search ? "没有匹配的权限" : "还没有权限"}
        description={search
          ? "换个关键词，或清空搜索条件后再试。"
          : "在菜单与权限中新增菜单后，会自动生成对应的菜单权限。"}
      >
        {#if search}
          <Button variant="outline" onclick={() => urlState.setSearch("")}>
            清空搜索
          </Button>
        {:else if auth.hasPermission("permissions")}
          <Button href="/settings/menu">前往菜单与权限</Button>
        {/if}
      </EmptyState>
    {:else}
      <p class="px-1 text-xs text-muted-foreground">
        隐藏菜单仍会出现在这里；隐藏只影响侧边栏展示，不影响权限与路由访问。
      </p>

      <div class="flex flex-col gap-2 md:hidden">
        {#each tree as node (node.code)}
          <div class="rounded-2xl border bg-card">
            <div class="flex items-start justify-between gap-2 p-4">
              <div class="flex min-w-0 flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{node.name}</span>
                  <Badge variant="default">菜单</Badge>
                </div>
                <code class="truncate text-xs text-muted-foreground">
                  {node.code}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${expanded.has(node.code) ? "收起" : "展开"} ${node.name}`}
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
                    暂无操作权限
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
              <TableHead class="w-[45%]">权限名称</TableHead>
              <TableHead class="w-[45%]">权限编码</TableHead>
              <TableHead class="w-[10%]">类型</TableHead>
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
                      aria-label={`${expanded.has(node.code) ? "收起" : "展开"} ${node.name}`}
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
                  <Badge variant="default">菜单</Badge>
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
                      <Badge variant="secondary">操作</Badge>
                    </TableCell>
                  </TableRow>
                {/each}
                {#if node.children.length === 0}
                  <TableRow>
                    <TableCell colspan={3}>
                      <div class="pl-9 text-sm text-muted-foreground">
                        暂无操作权限
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

<script lang="ts">
  import { onMount } from "svelte"
  import {
    Lock,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
  } from "@lucide/svelte"
  import ConfirmDeleteDialog from "#lib/components/shared/confirm-delete-dialog.svelte"
  import ColumnToggle from "#lib/components/shared/column-toggle.svelte"
  import DataList from "#lib/components/shared/data-list.svelte"
  import DensityToggle from "#lib/components/shared/density-toggle.svelte"
  import FormDialog from "#lib/components/shared/form-dialog.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import RecordCard from "#lib/components/shared/record-card.svelte"
  import RowActions from "#lib/components/shared/row-actions.svelte"
  import TablePagination from "#lib/components/shared/table-pagination.svelte"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import type { DataColumn } from "#lib/components/shared/data-column.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
  } from "#lib/components/ui/field/index.js"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { getPermissions } from "#lib/api/permission.js"
  import {
    createRole,
    deleteRole as apiDeleteRole,
    getRoles,
    updateRole,
  } from "#lib/api/role.js"
  import { useColumnVisibility } from "#lib/hooks/use-column-visibility.svelte.js"
  import { useDebouncedValue } from "#lib/hooks/use-debounced-value.svelte.js"
  import { usePagedList } from "#lib/hooks/use-paged-list.svelte.js"
  import { useTableDensity } from "#lib/hooks/use-table-density.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { useUrlListState } from "#lib/hooks/use-url-list-state.svelte.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import RolePermissionPicker from "./RolePermissionPicker.svelte"
  import type { Permission } from "#lib/types/permission.js"
  import type { Role } from "#lib/types/role.js"

  const DEFAULT_PAGE_SIZE = 8
  const PAGE_SIZE_OPTIONS = [8, 16, 32]

  const toast = useToast()
  let pageSize = $state(DEFAULT_PAGE_SIZE)

  const urlState = useUrlListState()
  const debouncedSearch = useDebouncedValue(() => urlState.search)

  const list = usePagedList<Role, { search: string }>({
    fetcher: getRoles,
    params: () => ({ search: debouncedSearch.value }),
    pageSize: () => pageSize,
    page: () => urlState.page,
    onPageChange: urlState.setPage,
  })

  let menuPermissions = $state<Permission[]>([])
  let operationPermissions = $state<Permission[]>([])
  let permissionsLoading = $state(true)
  let permissionsError = $state<string | null>(null)

  async function loadPermissions() {
    permissionsLoading = true
    permissionsError = null
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) menuPermissions = menuRes.data
    else permissionsError = menuRes.message || "加载菜单权限失败"
    if (opRes.code === 0) operationPermissions = opRes.data
    else permissionsError = opRes.message || "加载操作权限失败"
    permissionsLoading = false
  }

  onMount(() => {
    void loadPermissions()
  })

  let editOpen = $state(false)
  let editingRole = $state<Role | null>(null)
  let editForm = $state({ name: "", description: "" })
  let editPermissions = $state<string[]>([])
  let editSubmitting = $state(false)

  let deleteOpen = $state(false)
  let deleteTarget = $state<Role | null>(null)
  let deleteSubmitting = $state(false)

  function handleAdd() {
    editingRole = null
    editForm = { name: "", description: "" }
    editPermissions = []
    editOpen = true
  }

  function handleEdit(role: Role) {
    editingRole = role
    editForm = { name: role.name, description: role.description }
    editPermissions = [...role.permissions]
    editOpen = true
  }

  async function handleEditSubmit() {
    editSubmitting = true
    const payload = {
      name: editForm.name,
      description: editForm.description,
      permissions: editPermissions,
    }
    const res = editingRole
      ? await updateRole(editingRole.id, payload)
      : await createRole(payload)
    editSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "操作失败")
      return
    }
    toast.success(editingRole ? "保存成功" : "创建成功")
    editOpen = false
    list.refresh()
  }

  function handleDelete(role: Role) {
    deleteTarget = role
    deleteOpen = true
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteSubmitting = true
    const res = await apiDeleteRole(deleteTarget.id)
    deleteSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "删除失败")
      return
    }
    toast.success("删除成功")
    deleteOpen = false
    list.refresh()
  }

  function buildRoleActions(role: Role): RowAction[] {
    const actions: RowAction[] = []
    if (auth.hasPermission("roles.edit")) {
      actions.push({
        label: "编辑",
        icon: Pencil,
        onSelect: () => handleEdit(role),
      })
    }
    if (!role.isPreset && auth.hasPermission("roles.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(role),
      })
    }
    return actions
  }

  const columns: DataColumn[] = [
    { key: "name", header: "角色名称" },
    {
      key: "description",
      header: "描述",
      hideable: true,
      headClass: "hidden md:table-cell",
      cellClass: "hidden text-muted-foreground md:table-cell",
    },
    {
      key: "permissions",
      header: "权限数",
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass: "hidden lg:table-cell",
    },
    { key: "type", header: "类型" },
    {
      key: "actions",
      header: "操作",
      pinRight: true,
      headClass: "text-right",
      cellClass: "text-right",
    },
  ]

  const columnState = useColumnVisibility("roles", () => columns)
  const densityState = useTableDensity("roles")
</script>

<svelte:head><title>角色管理 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader title="角色管理" description="管理系统角色及其权限分配。" />

  <ListShell description={`共 ${list.total} 个角色`}>
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder="搜索角色名称…"
          aria-label="搜索角色"
          value={urlState.search}
          oninput={(event) => urlState.setSearch(event.currentTarget.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <ColumnToggle
        {columns}
        hidden={columnState.hidden}
        onToggle={columnState.toggle}
        onReset={columnState.reset}
      />
      <DensityToggle
        density={densityState.density}
        onChange={densityState.setDensity}
      />
      {#if auth.hasPermission("roles.create")}
        <Button class="w-full md:w-auto" onclick={handleAdd}>
          <Plus data-icon="inline-start" />
          新增角色
        </Button>
      {/if}
    {/snippet}

    {#if list.items.length > 0}
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#snippet footer()}
        <TablePagination
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          itemLabel="个角色"
          {pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={list.setPage}
          onPageSizeChange={(size) => {
            pageSize = size
            list.setPage(1)
          }}
        />
      {/snippet}
    {/if}

    <DataList
      items={list.items}
      loading={list.loading}
      error={list.error}
      columns={columnState.visibleColumns}
      density={densityState.density}
      skeletonColSpan={5}
      empty={{
        icon: ShieldCheck,
        title: debouncedSearch.value ? "没有匹配的角色" : "还没有角色",
        description: debouncedSearch.value
          ? "换个关键词，或清空搜索条件后再试。"
          : "创建角色并分配权限，再把角色授予用户。",
      }}
      onRetry={list.refresh}
      onHideColumn={columnState.toggle}
    >
      {#snippet emptyAction()}
        {#if debouncedSearch.value}
          <Button variant="outline" onclick={() => urlState.setSearch("")}
            >清空搜索</Button
          >
        {:else if auth.hasPermission("roles.create")}
          <Button onclick={handleAdd}>
            <Plus data-icon="inline-start" />
            新增角色
          </Button>
        {/if}
      {/snippet}

      {#snippet card(row: Role)}
        <RecordCard title={row.name} subtitle={row.description || "暂无描述"}>
          {#snippet badges()}
            {#if row.isPreset}
              <Badge variant="outline">预设</Badge>
            {:else}
              <Badge variant="secondary">自定义</Badge>
            {/if}
            <Badge variant="secondary">{row.permissions.length} 项权限</Badge>
          {/snippet}
          {#snippet actions()}
            <RowActions actions={buildRoleActions(row)} />
          {/snippet}
        </RecordCard>
      {/snippet}

      {#snippet head(key: string)}
        {columns.find((column) => column.key === key)?.header}
      {/snippet}

      {#snippet cell(key: string, row: Role)}
        {#if key === "name"}
          <span class="font-medium">{row.name}</span>
        {:else if key === "description"}
          {row.description || "-"}
        {:else if key === "permissions"}
          <Badge variant="secondary">{row.permissions.length}</Badge>
        {:else if key === "type"}
          {#if row.isPreset}
            <Badge variant="outline"><Lock />预设</Badge>
          {:else}
            <Badge variant="secondary">自定义</Badge>
          {/if}
        {:else if key === "actions"}
          <div class="flex items-center justify-end gap-1">
            {#if auth.hasPermission("roles.edit")}
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={() => handleEdit(row)}
              >
                <Pencil />
                <span class="sr-only">编辑 {row.name}</span>
              </Button>
            {/if}
            <RowActions
              actions={buildRoleActions(row).filter(
                (item) => item.label !== "编辑"
              )}
            />
          </div>
        {/if}
      {/snippet}
    </DataList>
  </ListShell>

  <FormDialog
    bind:open={editOpen}
    title={editingRole ? "编辑角色" : "新增角色"}
    description={editingRole
      ? "修改角色信息和权限分配。"
      : "填写角色信息并分配权限。"}
    submitting={editSubmitting}
    class="sm:w-[calc(100%_-_2rem)] sm:max-w-4xl"
    onSubmit={() => void handleEditSubmit()}
  >
    <FieldGroup>
      <div
        class="@md/field-group:grid @md/field-group:grid-cols-2 @md/field-group:items-start @md/field-group:gap-4"
      >
        <Field>
          <FieldLabel for="role-name">角色名称</FieldLabel>
          <Input
            id="role-name"
            bind:value={editForm.name}
            name="role-name"
            autocomplete="off"
            placeholder="请输入角色名称"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="role-desc">描述</FieldLabel>
          <Input
            id="role-desc"
            bind:value={editForm.description}
            name="role-desc"
            autocomplete="off"
            placeholder="请输入角色描述"
          />
        </Field>
      </div>
    </FieldGroup>

    <FieldSet class="mt-6 gap-3">
      <FieldLegend variant="label" class="mb-0">权限分配</FieldLegend>
      <RolePermissionPicker
        bind:value={editPermissions}
        {menuPermissions}
        {operationPermissions}
        loading={permissionsLoading}
        error={permissionsError}
        onRetry={() => void loadPermissions()}
      />
    </FieldSet>
  </FormDialog>

  <ConfirmDeleteDialog
    bind:open={deleteOpen}
    targetName={deleteTarget?.name ?? ""}
    description="已分配该角色的用户将失去对应权限。"
    loading={deleteSubmitting}
    onConfirm={() => void handleDeleteConfirm()}
  />
</div>

<script lang="ts">
  import { onMount } from "svelte"
  import {
    KeyRound,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserRound,
    Users,
  } from "@lucide/svelte"
  import BulkActionsBar from "#lib/components/shared/bulk-actions-bar.svelte"
  import ColumnToggle from "#lib/components/shared/column-toggle.svelte"
  import ConfirmDeleteDialog from "#lib/components/shared/confirm-delete-dialog.svelte"
  import DataList from "#lib/components/shared/data-list.svelte"
  import DensityToggle from "#lib/components/shared/density-toggle.svelte"
  import FormDialog from "#lib/components/shared/form-dialog.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import RecordCard from "#lib/components/shared/record-card.svelte"
  import RoleBadge from "#lib/components/shared/role-badge.svelte"
  import RowActions from "#lib/components/shared/row-actions.svelte"
  import TablePagination from "#lib/components/shared/table-pagination.svelte"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import type { DataColumn } from "#lib/components/shared/data-column.js"
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "#lib/components/ui/avatar/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import { Checkbox } from "#lib/components/ui/checkbox/index.js"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "#lib/components/ui/dialog/index.js"
  import {
    Field,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import {
    batchUpdateRole,
    createUser,
    deleteUser as apiDeleteUser,
    getUsers,
    resetPassword,
    updateUser,
  } from "#lib/api/user.js"
  import { getRoles } from "#lib/api/role.js"
  import { useColumnVisibility } from "#lib/hooks/use-column-visibility.svelte.js"
  import { useDebouncedValue } from "#lib/hooks/use-debounced-value.svelte.js"
  import { usePagedList } from "#lib/hooks/use-paged-list.svelte.js"
  import { useTableDensity } from "#lib/hooks/use-table-density.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { useUrlListState } from "#lib/hooks/use-url-list-state.svelte.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import type { Role } from "#lib/types/role.js"
  import type { User } from "#lib/types/user.js"

  const DEFAULT_PAGE_SIZE = 8
  const PAGE_SIZE_OPTIONS = [8, 16, 32]

  function generatePassword(length = 12) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const values = new Uint32Array(length)
    crypto.getRandomValues(values)
    return Array.from(values, (value) => chars[value % chars.length]).join("")
  }

  const toast = useToast()
  let roles = $state<Role[]>([])
  let pageSize = $state(DEFAULT_PAGE_SIZE)

  const urlState = useUrlListState()
  const debouncedSearch = useDebouncedValue(() => urlState.search)

  const list = usePagedList<User, { search: string }>({
    fetcher: getUsers,
    params: () => ({ search: debouncedSearch.value }),
    pageSize: () => pageSize,
    page: () => urlState.page,
    onPageChange: urlState.setPage,
  })

  onMount(async () => {
    const res = await getRoles({ pageSize: 100 })
    if (res.code === 0) roles = res.data.list
  })

  let editOpen = $state(false)
  let editingUser = $state<User | null>(null)
  let editForm = $state({ username: "", name: "", email: "", roleId: "user" })
  let editSubmitting = $state(false)

  let roleOpen = $state(false)
  let roleTarget = $state<User | null>(null)
  let roleValue = $state("")
  let roleSubmitting = $state(false)

  let deleteOpen = $state(false)
  let deleteTarget = $state<User | null>(null)
  let deleteSubmitting = $state(false)

  let pendingOpen = $state(false)
  let pendingUsers = $state<User[]>([])
  let selectedPending = $state<Set<string>>(new Set())
  let pendingLoading = $state(false)
  let pendingSubmitting = $state(false)
  let rejectOpen = $state(false)

  let resetOpen = $state(false)
  let resetTarget = $state<User | null>(null)
  let newPassword = $state("")
  let resetSubmitting = $state(false)

  function handleAdd() {
    editingUser = null
    editForm = { username: "", name: "", email: "", roleId: "user" }
    editOpen = true
  }

  function handleEdit(user: User) {
    editingUser = user
    editForm = {
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
    }
    editOpen = true
  }

  async function handleEditSubmit() {
    editSubmitting = true
    const payload = {
      username: editForm.username,
      name: editForm.name,
      email: editForm.email,
      roleId: editForm.roleId,
    }
    const res = editingUser
      ? await updateUser(editingUser.id, payload)
      : await createUser(payload)
    editSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "操作失败")
      return
    }
    toast.success(editingUser ? "保存成功" : "创建成功")
    editOpen = false
    list.refresh()
  }

  function handleRole(user: User) {
    roleTarget = user
    roleValue = user.roleId
    roleOpen = true
  }

  async function handleRoleSubmit() {
    if (!roleTarget) return
    roleSubmitting = true
    const res = await updateUser(roleTarget.id, { roleId: roleValue })
    roleSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "操作失败")
      return
    }
    toast.success("角色已更新")
    roleOpen = false
    list.refresh()
  }

  function handleDelete(user: User) {
    deleteTarget = user
    deleteOpen = true
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteSubmitting = true
    const res = await apiDeleteUser(deleteTarget.id)
    deleteSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "删除失败")
      return
    }
    toast.success("删除成功")
    deleteOpen = false
    list.refresh()
  }

  async function openPending() {
    pendingOpen = true
    pendingLoading = true
    selectedPending = new Set()
    const res = await getUsers({ pageSize: 100 })
    if (res.code === 0) {
      pendingUsers = res.data.list.filter(
        (user) => user.roleId === "pending_review"
      )
    } else {
      toast.error(res.message || "加载待审核用户失败")
    }
    pendingLoading = false
  }

  function togglePending(id: string) {
    const next = new Set(selectedPending)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedPending = next
  }

  function toggleAllPending() {
    if (selectedPending.size === pendingUsers.length) {
      selectedPending = new Set()
    } else {
      selectedPending = new Set(pendingUsers.map((user) => user.id))
    }
  }

  async function handleBatchApprove() {
    if (selectedPending.size === 0) return
    pendingSubmitting = true
    const res = await batchUpdateRole(
      Array.from(selectedPending, Number),
      "user"
    )
    pendingSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "审核失败")
      return
    }
    toast.success(`已通过 ${selectedPending.size} 位用户审核`)
    pendingOpen = false
    list.refresh()
  }

  async function handleBatchReject() {
    if (selectedPending.size === 0) return
    pendingSubmitting = true
    const results = await Promise.all(
      Array.from(selectedPending).map((id) => apiDeleteUser(id))
    )
    pendingSubmitting = false
    rejectOpen = false

    const failed = results.filter((res) => res.code !== 0).length
    if (failed > 0) {
      toast.error(`${failed} 位用户拒绝失败`)
      await openPending()
      return
    }

    toast.success(`已拒绝 ${selectedPending.size} 位用户`)
    pendingOpen = false
    list.refresh()
  }

  function openReset(user: User) {
    resetTarget = user
    newPassword = generatePassword()
    resetOpen = true
  }

  async function handleResetSubmit() {
    if (!resetTarget) return
    resetSubmitting = true
    const res = await resetPassword(resetTarget.id, newPassword)
    resetSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "重置失败")
      return
    }
    toast.success("密码已重置")
    resetOpen = false
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(newPassword)
      toast.success("密码已复制到剪贴板")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  function buildUserActions(user: User): RowAction[] {
    const actions: RowAction[] = []
    if (auth.hasPermission("users.edit")) {
      actions.push({
        label: "编辑",
        icon: Pencil,
        onSelect: () => handleEdit(user),
      })
    }
    if (auth.hasPermission("users.assign_role")) {
      actions.push({
        label: "维护角色",
        icon: Shield,
        onSelect: () => handleRole(user),
      })
    }
    if (auth.hasPermission("users.edit")) {
      actions.push({
        label: "重置密码",
        icon: KeyRound,
        onSelect: () => openReset(user),
      })
    }
    if (auth.hasPermission("users.delete") && user.id !== auth.user?.id) {
      actions.push({
        label: "删除",
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(user),
      })
    }
    return actions
  }

  const allPendingSelected = $derived(
    pendingUsers.length > 0 && selectedPending.size === pendingUsers.length
  )
  const somePendingSelected = $derived(
    selectedPending.size > 0 && !allPendingSelected
  )

  let selectedIds = $state<Set<string>>(new Set())
  let bulkRoleOpen = $state(false)
  let bulkRoleId = $state("user")
  let bulkSubmitting = $state(false)

  const pageIds = $derived(list.items.map((user) => user.id))
  const allSelected = $derived(
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  )
  const someSelected = $derived(
    !allSelected && pageIds.some((id) => selectedIds.has(id))
  )

  $effect(() => {
    void list.page
    void debouncedSearch.value
    selectedIds = new Set()
  })

  function toggleSelected(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds = next
  }

  function toggleAll(checked: boolean) {
    selectedIds = checked ? new Set(pageIds) : new Set()
  }

  async function handleBulkRoleSubmit() {
    if (selectedIds.size === 0) return
    bulkSubmitting = true
    const res = await batchUpdateRole(
      Array.from(selectedIds, Number),
      bulkRoleId
    )
    bulkSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "批量操作失败")
      return
    }
    toast.success(`已更新 ${selectedIds.size} 位用户的角色`)
    bulkRoleOpen = false
    selectedIds = new Set()
    list.refresh()
  }

  const columns: DataColumn[] = [
    { key: "select", header: "", headClass: "w-10" },
    { key: "username", header: "用户名" },
    {
      key: "name",
      header: "姓名",
      hideable: true,
      headClass: "hidden md:table-cell",
      cellClass: "hidden md:table-cell",
    },
    {
      key: "email",
      header: "邮箱",
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass: "hidden text-muted-foreground lg:table-cell",
    },
    { key: "role", header: "角色" },
    {
      key: "actions",
      header: "操作",
      pinRight: true,
      headClass: "text-right",
      cellClass: "text-right",
    },
  ]

  const roleItems = $derived(
    roles.map((role) => ({ value: role.id, label: role.name }))
  )

  const columnState = useColumnVisibility("users", () => columns)
  const densityState = useTableDensity("users")

  const pendingColumns: DataColumn[] = [
    { key: "select", header: "", headClass: "w-12" },
    { key: "username", header: "用户名" },
    { key: "name", header: "姓名" },
    { key: "email", header: "邮箱" },
  ]
</script>

<svelte:head><title>用户管理 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader title="用户管理" description="管理团队成员及其角色权限。" />

  <ListShell description={`共 ${list.total} 位用户`}>
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder="搜索用户名、姓名或邮箱…"
          aria-label="搜索用户"
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
      {#if auth.hasPermission("users.create")}
        <Button class="w-full md:w-auto" onclick={handleAdd}>
          <Plus data-icon="inline-start" />
          新增用户
        </Button>
      {/if}
      {#if auth.hasPermission("users.edit")}
        <Button
          variant="outline"
          class="w-full md:w-auto"
          onclick={openPending}
        >
          待审核
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
          itemLabel="位用户"
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
      skeletonColSpan={6}
      empty={{
        icon: Users,
        title: debouncedSearch.value ? "没有匹配的用户" : "还没有用户",
        description: debouncedSearch.value
          ? "换个关键词，或清空搜索条件后再试。"
          : "创建第一位用户，或等待注册审核通过。",
      }}
      onRetry={list.refresh}
      onHideColumn={columnState.toggle}
    >
      {#snippet emptyAction()}
        {#if debouncedSearch.value}
          <Button variant="outline" onclick={() => urlState.setSearch("")}
            >清空搜索</Button
          >
        {:else if auth.hasPermission("users.create")}
          <Button onclick={handleAdd}>
            <Plus data-icon="inline-start" />
            新增用户
          </Button>
        {/if}
      {/snippet}

      {#snippet card(row: User)}
        <RecordCard subtitle={`@${row.username} · ${row.email}`}>
          {#snippet leading()}
            <Checkbox
              checked={selectedIds.has(row.id)}
              aria-label={`选择 ${row.name}`}
              class="mt-0.5"
              onCheckedChange={() => toggleSelected(row.id)}
            />
          {/snippet}
          {#snippet titleContent()}
            <span class="flex items-center gap-2">
              <Avatar class="size-7">
                {#if row.avatar}
                  <AvatarImage
                    src={row.avatar}
                    alt={row.name}
                    width={28}
                    height={28}
                  />
                {/if}
                <AvatarFallback>{row.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span class="truncate">{row.name}</span>
            </span>
          {/snippet}
          {#snippet badges()}
            <RoleBadge roleId={row.roleId} {roles} />
          {/snippet}
          {#snippet actions()}
            <RowActions actions={buildUserActions(row)} />
          {/snippet}
        </RecordCard>
      {/snippet}

      {#snippet head(key: string)}
        {#if key === "select"}
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            aria-label="全选当前页用户"
            onCheckedChange={(value) => toggleAll(value === true)}
          />
        {:else}
          {columns.find((column) => column.key === key)?.header}
        {/if}
      {/snippet}

      {#snippet cell(key: string, row: User)}
        {#if key === "select"}
          <Checkbox
            checked={selectedIds.has(row.id)}
            aria-label={`选择 ${row.name}`}
            class="relative z-20"
            onCheckedChange={() => toggleSelected(row.id)}
          />
        {:else if key === "username"}
          <div class="flex items-center gap-3">
            <Avatar class="size-8">
              {#if row.avatar}
                <AvatarImage
                  src={row.avatar}
                  alt={row.name}
                  width={32}
                  height={32}
                />
              {/if}
              <AvatarFallback>{row.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span class="text-sm font-medium">{row.username}</span>
          </div>
        {:else if key === "name"}
          {row.name}
        {:else if key === "email"}
          {row.email}
        {:else if key === "role"}
          <RoleBadge roleId={row.roleId} {roles} />
        {:else if key === "actions"}
          <div class="flex items-center justify-end gap-1">
            {#if auth.hasPermission("users.edit")}
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
              actions={buildUserActions(row).filter(
                (item) => item.label !== "编辑"
              )}
            />
          </div>
        {/if}
      {/snippet}
    </DataList>
  </ListShell>

  <BulkActionsBar
    count={selectedIds.size}
    entityName="位用户"
    onClear={() => (selectedIds = new Set())}
  >
    {#if auth.hasPermission("users.assign_role")}
      <Button size="sm" onclick={() => (bulkRoleOpen = true)}>
        批量维护角色
      </Button>
    {/if}
  </BulkActionsBar>

  <FormDialog
    bind:open={bulkRoleOpen}
    title="批量维护角色"
    description={`将为已选的 ${selectedIds.size} 位用户设置同一角色。`}
    submitting={bulkSubmitting}
    submitLabel="保存"
    onSubmit={() => void handleBulkRoleSubmit()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="bulk-role">角色</FieldLabel>
        <Select
          type="single"
          items={roleItems}
          value={bulkRoleId}
          onValueChange={(value) => {
            if (value) bulkRoleId = value
          }}
        >
          <SelectTrigger id="bulk-role" class="w-full" aria-label="角色">
            <SelectValue placeholder="请选择角色" />
          </SelectTrigger>
          <SelectContent>
            {#each roles as role (role.id)}
              <SelectItem value={role.id}>{role.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  </FormDialog>

  <FormDialog
    bind:open={editOpen}
    title={editingUser ? "编辑用户" : "新增用户"}
    description={editingUser
      ? "修改用户的基本信息。"
      : "填写以下信息创建新用户。"}
    submitting={editSubmitting}
    submitLabel={editingUser ? "保存" : "创建"}
    onSubmit={() => void handleEditSubmit()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="username">用户名</FieldLabel>
        <Input
          id="username"
          bind:value={editForm.username}
          name="username"
          autocomplete="off"
          spellcheck={false}
          placeholder="请输入用户名"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="name">姓名</FieldLabel>
        <Input
          id="name"
          bind:value={editForm.name}
          name="name"
          autocomplete="off"
          placeholder="请输入姓名"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="email">邮箱</FieldLabel>
        <Input
          id="email"
          bind:value={editForm.email}
          name="email"
          autocomplete="off"
          spellcheck={false}
          type="email"
          placeholder="请输入邮箱"
          required
        />
      </Field>
      {#if auth.hasPermission("users.assign_role")}
        <Field>
          <FieldLabel>角色</FieldLabel>
          <Select
            type="single"
            items={roleItems}
            value={editForm.roleId}
            onValueChange={(value) => {
              if (value) editForm.roleId = value
            }}
          >
            <SelectTrigger class="w-full" aria-label="角色">
              <SelectValue placeholder="请选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {#each roles as role (role.id)}
                  <SelectItem value={role.id}>{role.name}</SelectItem>
                {/each}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      {/if}
    </FieldGroup>
  </FormDialog>

  <FormDialog
    bind:open={roleOpen}
    title="维护角色"
    description={`为 ${roleTarget?.name ?? ""} 修改角色。`}
    submitting={roleSubmitting}
    submitLabel="确认修改"
    onSubmit={() => void handleRoleSubmit()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel>当前角色</FieldLabel>
        <div>
          {#if roleTarget}
            <RoleBadge roleId={roleTarget.roleId} {roles} />
          {/if}
        </div>
      </Field>
      <Field>
        <FieldLabel>新角色</FieldLabel>
        <Select
          type="single"
          items={roleItems}
          value={roleValue}
          onValueChange={(value) => {
            if (value) roleValue = value
          }}
        >
          <SelectTrigger class="w-full" aria-label="新角色">
            <SelectValue placeholder="请选择角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {#each roles as role (role.id)}
                <SelectItem value={role.id}>{role.name}</SelectItem>
              {/each}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  </FormDialog>

  <ConfirmDeleteDialog
    bind:open={deleteOpen}
    targetName={deleteTarget?.name ?? ""}
    loading={deleteSubmitting}
    onConfirm={() => void handleDeleteConfirm()}
  />

  <Dialog bind:open={resetOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>重置密码</DialogTitle>
        <DialogDescription>
          为 <span class="font-medium">{resetTarget?.name}</span> 重置密码
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel>新密码</FieldLabel>
          <div class="flex gap-2">
            <Input
              name="newPassword"
              autocomplete="off"
              value={newPassword}
              readonly
              class="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="重新生成密码"
              onclick={() => (newPassword = generatePassword())}
            >
              <RefreshCw />
            </Button>
            <Button variant="outline" onclick={() => void copyPassword()}
              >复制</Button
            >
          </div>
          <p class="text-sm text-muted-foreground">请将密码发送给用户。</p>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <LoadingButton
          loading={resetSubmitting}
          onclick={() => void handleResetSubmit()}
        >
          确认重置
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog bind:open={pendingOpen}>
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>待审核用户</DialogTitle>
        <DialogDescription>
          共 {pendingUsers.length} 位用户等待审核，已选择 {selectedPending.size} 位。
        </DialogDescription>
      </DialogHeader>
      <DataList
        items={pendingUsers}
        loading={pendingLoading}
        error={null}
        columns={pendingColumns}
        skeletonColSpan={4}
        stickyHeader={false}
        bordered={false}
        empty={{
          icon: UserRound,
          title: "暂无待审核用户",
          description: "开启人工审核后，新注册用户会出现在这里。",
        }}
        onRetry={() => void openPending()}
        onHideColumn={() => {}}
      >
        {#snippet head(key: string)}
          {#if key === "select"}
            <Checkbox
              checked={allPendingSelected}
              indeterminate={somePendingSelected}
              aria-label="选择全部待审核用户"
              onCheckedChange={toggleAllPending}
            />
          {:else}
            {pendingColumns.find((column) => column.key === key)?.header}
          {/if}
        {/snippet}
        {#snippet cell(key: string, row: User)}
          {#if key === "select"}
            <Checkbox
              checked={selectedPending.has(row.id)}
              aria-label={`选择 ${row.name}`}
              class="relative z-20"
              onCheckedChange={() => togglePending(row.id)}
            />
          {:else if key === "username"}
            {row.username}
          {:else if key === "name"}
            {row.name}
          {:else if key === "email"}
            {row.email}
          {/if}
        {/snippet}
        {#snippet card(row: User)}
          <RecordCard
            title={row.name}
            subtitle={`@${row.username} · ${row.email}`}
          >
            {#snippet leading()}
              <Checkbox
                checked={selectedPending.has(row.id)}
                aria-label={`选择 ${row.name}`}
                class="mt-0.5"
                onCheckedChange={() => togglePending(row.id)}
              />
            {/snippet}
          </RecordCard>
        {/snippet}
      </DataList>
      <DialogFooter class="gap-2">
        <Button
          variant="destructive"
          disabled={selectedPending.size === 0 || pendingSubmitting}
          onclick={() => (rejectOpen = true)}
        >
          拒绝 ({selectedPending.size})
        </Button>
        <LoadingButton
          disabled={selectedPending.size === 0}
          loading={pendingSubmitting}
          onclick={() => void handleBatchApprove()}
        >
          通过 ({selectedPending.size})
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ConfirmDeleteDialog
    bind:open={rejectOpen}
    targetName={`选中的 ${selectedPending.size} 位用户`}
    description="拒绝后这些账号会被删除。"
    loading={pendingSubmitting}
    onConfirm={() => void handleBatchReject()}
  />
</div>

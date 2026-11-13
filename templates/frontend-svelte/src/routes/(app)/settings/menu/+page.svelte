<script lang="ts">
  import { onMount } from "svelte"
  import {
    ChevronRight,
    GripVertical,
    KeyRound,
    Plus,
    Search,
    Trash2,
  } from "@lucide/svelte"
  import ConfirmDeleteDialog from "#lib/components/shared/confirm-delete-dialog.svelte"
  import ConfirmHideDialog from "#lib/components/shared/confirm-hide-dialog.svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import ErrorState from "#lib/components/shared/error-state.svelte"
  import FormDialog from "#lib/components/shared/form-dialog.svelte"
  import IconPicker from "#lib/components/shared/icon-picker.svelte"
  import InlineError from "#lib/components/shared/inline-error.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import PageFormSkeleton from "#lib/components/shared/page-form-skeleton.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import RowActions from "#lib/components/shared/row-actions.svelte"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
  } from "#lib/components/ui/input-group/index.js"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import { Switch } from "#lib/components/ui/switch/index.js"
  import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
  } from "#lib/components/ui/table/index.js"
  import {
    createMenuGroup,
    createMenuItem,
    deleteMenuGroup,
    deleteMenuItem,
    getMenuConfig,
    saveMenuLayout,
    updateMenuGroup,
    updateMenuItem,
  } from "#lib/api/menu.js"
  import {
    createPermission,
    deletePermission,
    updatePermission,
  } from "#lib/api/permission.js"
  import { useMediaQuery } from "#lib/hooks/use-media-query.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { OPERATION_PRESETS, buildOperationCode } from "#lib/access-tree.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import type {
    MenuConfig,
    MenuGroup,
    MenuItem,
    MenuOperation,
  } from "#lib/types/menu.js"
  import {
    cloneMenuConfig,
    moveMenuGroup,
    moveMenuItem,
    normalizeMenuConfig,
  } from "./menu-drag.js"

  const NAVIGATION_REFRESH_EVENT = "navigation-refresh"

  type DeleteTarget =
    | { type: "group"; id: string; name: string }
    | { type: "item"; id: string; name: string; operationCount: number }
    | { type: "operation"; id: string; name: string }
    | null

  const toast = useToast()
  const isCompact = useMediaQuery("(max-width: 767px)")

  let config = $state<MenuConfig | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let saving = $state(false)
  let submitting = $state(false)
  let expanded = $state<Set<string>>(new Set())
  let collapsedGroups = $state<Set<string>>(new Set())
  let search = $state("")

  let groupOpen = $state(false)
  let editingGroup = $state<MenuGroup | null>(null)
  let groupName = $state("")

  let itemOpen = $state(false)
  let editingItem = $state<MenuItem | null>(null)
  let itemForm = $state({
    permissionCode: "",
    name: "",
    groupId: "",
    route: "",
    icon: "circle",
    hidden: false,
  })

  let operationOpen = $state(false)
  let operationMenu = $state<MenuItem | null>(null)
  let editingOperation = $state<MenuOperation | null>(null)
  let operationForm = $state({
    name: "",
    verb: "view",
    code: "",
    custom: false,
  })

  let deleteTarget = $state<DeleteTarget>(null)
  let deleteOpen = $state(false)
  let deleteLoading = $state(false)
  let hideConfirmTarget = $state<MenuItem | null>(null)
  let hideOpen = $state(false)
  let hideConfirmLoading = $state(false)

  function askDelete(target: DeleteTarget) {
    deleteTarget = target
    deleteOpen = true
  }

  function askHide(item: MenuItem) {
    hideConfirmTarget = item
    hideOpen = true
  }
  let pendingItemSubmit = $state(false)

  const canReorder = $derived(auth.hasPermission("menus.reorder"))
  const canCreate = $derived(auth.hasPermission("menus.create"))
  const canEdit = $derived(auth.hasPermission("menus.edit"))
  const canDelete = $derived(auth.hasPermission("menus.delete"))
  const canViewOverview = $derived(auth.hasPermission("permissions"))
  const canCreateOperation = $derived(auth.hasPermission("permissions.create"))
  const canEditOperation = $derived(auth.hasPermission("permissions.edit"))
  const canDeleteOperation = $derived(auth.hasPermission("permissions.delete"))
  const reorderEnabled = $derived(canReorder && !search.trim() && !saving)

  const tableCollapsedGroups = $derived(
    search.trim() ? new Set<string>() : collapsedGroups
  )

  const groupItems = $derived(
    (config?.groups ?? []).map((group) => ({
      value: group.id,
      label: group.name,
    }))
  )
  const operationVerbItems = OPERATION_PRESETS.map((preset) => ({
    value: preset.verb,
    label: preset.label,
  }))

  const menuStats = $derived.by(() => {
    const groups = config?.groups ?? []
    const menus = groups.reduce((sum, group) => sum + group.items.length, 0)
    const operations = groups.reduce(
      (sum, group) =>
        sum +
        group.items.reduce(
          (itemSum, item) => itemSum + item.operations.length,
          0
        ),
      0
    )
    return `共 ${groups.length} 个分组，${menus} 个菜单，${operations} 个操作权限`
  })

  const visibleGroups = $derived.by<MenuGroup[]>(() => {
    if (!config) return []
    const query = search.trim().toLowerCase()
    if (!query) return config.groups
    return config.groups
      .map((group) => {
        const groupMatch = group.name.toLowerCase().includes(query)
        const items = group.items.filter((item) => {
          const itemMatch =
            item.name.toLowerCase().includes(query) ||
            item.permissionCode.toLowerCase().includes(query) ||
            item.route.toLowerCase().includes(query)
          const operationMatch = item.operations.some(
            (operation) =>
              operation.name.toLowerCase().includes(query) ||
              operation.code.toLowerCase().includes(query)
          )
          return itemMatch || operationMatch
        })
        if (!groupMatch && items.length === 0) return null
        return { ...group, items: groupMatch ? group.items : items }
      })
      .filter((group): group is MenuGroup => group !== null)
  })

  $effect(() => {
    void search
    void config
    const query = search.trim().toLowerCase()
    if (!query || !config) return
    const next = new Set<string>()
    for (const group of config.groups) {
      for (const item of group.items) {
        if (
          item.operations.some(
            (operation) =>
              operation.name.toLowerCase().includes(query) ||
              operation.code.toLowerCase().includes(query)
          )
        ) {
          next.add(item.permissionCode)
        }
      }
    }
    expanded = next
  })

  async function load(): Promise<boolean> {
    loading = true
    error = null
    const response = await getMenuConfig()
    if (response.code === 0) {
      config = cloneMenuConfig(response.data)
      loading = false
      return true
    }
    error = response.message || "加载菜单失败"
    loading = false
    return false
  }

  onMount(() => {
    void load()
  })

  function toggleExpanded(permissionCode: string) {
    const next = new Set(expanded)
    if (next.has(permissionCode)) next.delete(permissionCode)
    else next.add(permissionCode)
    expanded = next
  }

  function toggleGroup(groupId: string) {
    const next = new Set(collapsedGroups)
    if (next.has(groupId)) next.delete(groupId)
    else next.add(groupId)
    collapsedGroups = next
  }

  async function persistLayout(next: MenuConfig) {
    if (!canReorder || saving) return
    saving = true
    try {
      const response = await saveMenuLayout({
        version: next.version,
        groups: next.groups.map((group) => ({
          id: group.id,
          sortOrder: group.sortOrder,
          items: group.items.map((item) => ({
            permissionCode: item.permissionCode,
            sortOrder: item.sortOrder,
          })),
        })),
      })
      if (response.code !== 0) {
        toast.error(response.message || "保存失败")
        await load()
        return
      }
      const updated = cloneMenuConfig(next)
      updated.version = response.data.version
      config = updated
      error = null
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
    } finally {
      saving = false
    }
  }

  function moveGroup(groupId: string, direction: -1 | 1) {
    if (!config || !reorderEnabled) return
    const next = moveMenuGroup(config, groupId, direction)
    config = next
    void persistLayout(next)
  }

  function moveItem(
    groupId: string,
    permissionCode: string,
    direction: -1 | 1
  ) {
    if (!config || !reorderEnabled) return
    const next = moveMenuItem(config, groupId, permissionCode, direction)
    config = next
    void persistLayout(next)
  }

  type DragState =
    | { type: "group"; groupId: string }
    | { type: "item"; groupId: string; permissionCode: string }

  let dragMoved = false

  function startDrag(event: PointerEvent, state: DragState) {
    if (!reorderEnabled) return
    event.preventDefault()
    dragMoved = false

    const onMove = (moveEvent: PointerEvent) => {
      const element = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      )
      const itemElement = element?.closest<HTMLElement>("[data-menu-item]")
      const groupElement = element?.closest<HTMLElement>("[data-menu-group]")
      if (state.type === "item") {
        if (itemElement) {
          const targetGroup = itemElement.dataset.groupId
          const targetCode = itemElement.dataset.menuItem
          if (
            targetGroup &&
            targetCode &&
            !(
              targetGroup === state.groupId &&
              targetCode === state.permissionCode
            )
          ) {
            moveItemTo(state, targetGroup, targetCode)
            dragMoved = true
          }
        } else if (groupElement) {
          const targetGroup = groupElement.dataset.menuGroup
          if (targetGroup) {
            moveItemTo(state, targetGroup, null)
            dragMoved = true
          }
        }
      } else if (groupElement) {
        const targetGroup = groupElement.dataset.menuGroup
        if (targetGroup && targetGroup !== state.groupId) {
          moveGroupTo(state.groupId, targetGroup)
          dragMoved = true
        }
      }
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      if (dragMoved && config) void persistLayout(config)
      dragMoved = false
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  function moveItemTo(
    state: { groupId: string; permissionCode: string },
    targetGroupId: string,
    targetCode: string | null
  ) {
    if (!config) return
    const next = cloneMenuConfig(config)
    const sourceGroup = next.groups.find((group) => group.id === state.groupId)
    const targetGroup = next.groups.find((group) => group.id === targetGroupId)
    if (!sourceGroup || !targetGroup) return
    const from = sourceGroup.items.findIndex(
      (item) => item.permissionCode === state.permissionCode
    )
    if (from < 0) return

    let to = targetGroup.items.length
    if (targetCode) {
      const found = targetGroup.items.findIndex(
        (item) => item.permissionCode === targetCode
      )
      if (found >= 0) to = found
    }

    const [item] = sourceGroup.items.splice(from, 1)
    item.groupId = targetGroup.id
    const insertAt =
      targetGroup.id === sourceGroup.id
        ? Math.min(to, targetGroup.items.length)
        : Math.min(to, targetGroup.items.length)
    targetGroup.items.splice(insertAt, 0, item)
    config = normalizeMenuConfig(next)
  }

  function moveGroupTo(groupId: string, targetGroupId: string) {
    if (!config) return
    const next = cloneMenuConfig(config)
    const from = next.groups.findIndex((group) => group.id === groupId)
    const to = next.groups.findIndex((group) => group.id === targetGroupId)
    if (from < 0 || to < 0 || from === to) return
    const [group] = next.groups.splice(from, 1)
    next.groups.splice(to, 0, group)
    config = normalizeMenuConfig(next)
  }

  function openCreateGroup() {
    editingGroup = null
    groupName = ""
    groupOpen = true
  }

  function openEditGroup(group: MenuGroup) {
    editingGroup = group
    groupName = group.name
    groupOpen = true
  }

  async function submitGroup() {
    if (saving) return
    saving = true
    submitting = true
    try {
      const response = editingGroup
        ? await updateMenuGroup(editingGroup.id, groupName)
        : await createMenuGroup(groupName)
      if (response.code !== 0) {
        toast.error(response.message || "操作失败")
        return
      }
      groupOpen = false
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(editingGroup ? "分组已更新" : "分组已创建")
    } finally {
      submitting = false
      saving = false
    }
  }

  function openCreateItem(groupId: string) {
    editingItem = null
    itemForm = {
      permissionCode: "",
      name: "",
      groupId,
      route: "",
      icon: "circle",
      hidden: false,
    }
    itemOpen = true
  }

  function openEditItem(item: MenuItem) {
    editingItem = item
    itemForm = {
      permissionCode: item.permissionCode,
      name: item.name,
      groupId: item.groupId,
      route: item.route,
      icon: item.icon,
      hidden: item.hidden,
    }
    itemOpen = true
  }

  async function submitItem() {
    if (saving) return
    if (
      editingItem &&
      (editingItem.permissionCode === "menus" ||
        editingItem.permissionCode === "settings") &&
      itemForm.hidden &&
      !editingItem.hidden
    ) {
      hideConfirmTarget = editingItem
      hideOpen = true
      pendingItemSubmit = true
      return
    }
    await submitItemNow()
  }

  async function submitItemNow() {
    if (saving) return
    saving = true
    submitting = true
    try {
      const response = editingItem
        ? await updateMenuItem(editingItem.permissionCode, {
            name: itemForm.name,
            groupId: itemForm.groupId,
            route: itemForm.route,
            icon: itemForm.icon,
            hidden: itemForm.hidden,
          })
        : await createMenuItem(itemForm)
      if (response.code !== 0) {
        toast.error(response.message || "操作失败")
        return
      }
      itemOpen = false
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(editingItem ? "菜单已更新" : "菜单已创建")
    } finally {
      submitting = false
      saving = false
    }
  }

  async function applyHidden(item: MenuItem, hidden: boolean) {
    if (saving) return false
    saving = true
    try {
      const response = await updateMenuItem(item.permissionCode, { hidden })
      if (response.code !== 0) {
        toast.error(response.message || "操作失败")
        return false
      }
      if (!(await load())) {
        toast.error("菜单状态已保存，但列表刷新失败，请重试")
        return false
      }
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(hidden ? "菜单已隐藏" : "菜单已显示")
      return true
    } finally {
      saving = false
    }
  }

  async function toggleHidden(item: MenuItem) {
    if (item.hidden) {
      await applyHidden(item, false)
      return
    }
    if (item.permissionCode === "menus" || item.permissionCode === "settings") {
      pendingItemSubmit = false
      askHide(item)
      return
    }
    await applyHidden(item, true)
  }

  async function handleHideConfirm() {
    if (!hideConfirmTarget || saving) return
    hideConfirmLoading = true
    if (pendingItemSubmit) {
      pendingItemSubmit = false
      hideConfirmTarget = null
      hideConfirmLoading = false
      await submitItemNow()
      return
    }
    const ok = await applyHidden(hideConfirmTarget, true)
    hideConfirmLoading = false
    if (ok) {
      hideConfirmTarget = null
      hideOpen = false
    }
  }

  function openCreateOperation(item: MenuItem) {
    operationMenu = item
    editingOperation = null
    operationForm = {
      name: "",
      verb: "view",
      code: buildOperationCode(item.permissionCode, "view"),
      custom: false,
    }
    operationOpen = true
  }

  function openEditOperation(item: MenuItem, operation: MenuOperation) {
    operationMenu = item
    editingOperation = operation
    operationForm = {
      name: operation.name,
      verb: "",
      code: operation.code,
      custom: true,
    }
    operationOpen = true
  }

  function handleDeleteOperation(_item: MenuItem, operation: MenuOperation) {
    askDelete({
      type: "operation",
      id: operation.code,
      name: operation.name,
    })
  }

  function handleOperationVerbChange(verb: string) {
    operationForm.verb = verb
    if (!operationForm.custom && operationMenu) {
      operationForm.code = buildOperationCode(
        operationMenu.permissionCode,
        verb
      )
    }
  }

  function handleOperationCustomChange(custom: boolean) {
    operationForm.custom = custom
    if (!custom && operationMenu) {
      operationForm.code = buildOperationCode(
        operationMenu.permissionCode,
        operationForm.verb || "view"
      )
    }
  }

  async function submitOperation() {
    if (!operationMenu || saving) return
    if (!operationForm.name.trim()) {
      toast.error("请输入权限名称")
      return
    }
    const code = operationForm.code.trim()
    if (!editingOperation && !code) {
      toast.error("请输入权限编码")
      return
    }

    saving = true
    submitting = true
    try {
      const response = editingOperation
        ? await updatePermission(editingOperation.code, {
            name: operationForm.name,
            parent: operationMenu.permissionCode,
          })
        : await createPermission({
            code,
            name: operationForm.name,
            type: "operation",
            parent: operationMenu.permissionCode,
          })
      if (response.code !== 0) {
        toast.error(response.message || "操作失败")
        return
      }
      toast.success(editingOperation ? "操作权限已更新" : "操作权限已创建")
      operationOpen = false
      await load()
    } finally {
      submitting = false
      saving = false
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || saving) return
    const target = deleteTarget
    saving = true
    deleteLoading = true
    try {
      const response =
        target.type === "group"
          ? await deleteMenuGroup(target.id)
          : target.type === "item"
            ? await deleteMenuItem(target.id)
            : await deletePermission(target.id)
      if (response.code !== 0) {
        toast.error(response.message || "删除失败")
        return
      }
      deleteOpen = false
      deleteTarget = null
      await load()
      if (target.type !== "operation") {
        window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      }
      toast.success("删除成功")
    } finally {
      deleteLoading = false
      saving = false
    }
  }

  const deleteDescription = $derived.by(() => {
    if (deleteTarget?.type === "item") {
      return deleteTarget.operationCount > 0
        ? `删除后将同时移除 ${deleteTarget.operationCount} 个操作权限，并从相关角色中移除授权。`
        : "对应菜单权限和角色授权也会被删除。"
    }
    if (deleteTarget?.type === "operation") {
      return "删除后，已授予该权限的角色会同步失去此权限。"
    }
    if (deleteTarget?.type === "group") {
      return "仅空分组可以删除。"
    }
    return undefined
  })

  const operationTitle = $derived(
    editingOperation ? "编辑操作权限" : "新增操作权限"
  )
  const operationDescription = $derived(
    operationMenu
      ? `所属菜单：${operationMenu.name}（${operationMenu.permissionCode}）`
      : undefined
  )

  function buildGroupActions(group: MenuGroup): RowAction[] {
    const actions: RowAction[] = []
    if (canCreate) {
      actions.push({
        label: "新增菜单",
        icon: Plus,
        onSelect: () => openCreateItem(group.id),
      })
    }
    if (canEdit) {
      actions.push({
        label: "编辑分组",
        onSelect: () => openEditGroup(group),
      })
    }
    if (reorderEnabled) {
      actions.push({
        label: "上移",
        disabled:
          (config?.groups.findIndex((item) => item.id === group.id) ?? 0) <= 0,
        onSelect: () => moveGroup(group.id, -1),
        separatorBefore: true,
      })
      actions.push({
        label: "下移",
        disabled:
          (config?.groups.findIndex((item) => item.id === group.id) ?? 0) >=
          (config?.groups.length ?? 1) - 1,
        onSelect: () => moveGroup(group.id, 1),
      })
    }
    if (canDelete) {
      actions.push({
        label: "删除分组",
        destructive: true,
        separatorBefore: true,
        onSelect: () =>
          askDelete({
            type: "group",
            id: group.id,
            name: group.name,
          }),
      })
    }
    return actions
  }

  function buildMenuActions(
    item: MenuItem,
    index: number,
    length: number
  ): RowAction[] {
    const actions: RowAction[] = []
    if (canCreateOperation) {
      actions.push({
        label: "新增操作权限",
        icon: KeyRound,
        onSelect: () => openCreateOperation(item),
      })
    }
    if (canEdit) {
      actions.push({
        label: "编辑菜单",
        onSelect: () => openEditItem(item),
      })
      actions.push({
        label: item.hidden ? "显示菜单" : "隐藏菜单",
        onSelect: () => void toggleHidden(item),
      })
    }
    if (reorderEnabled) {
      actions.push({
        label: "上移",
        disabled: index <= 0,
        onSelect: () => moveItem(item.groupId, item.permissionCode, -1),
        separatorBefore: true,
      })
      actions.push({
        label: "下移",
        disabled: index >= length - 1,
        onSelect: () => moveItem(item.groupId, item.permissionCode, 1),
      })
    }
    if (canDelete) {
      actions.push({
        label: "删除菜单",
        destructive: true,
        separatorBefore: true,
        onSelect: () =>
          askDelete({
            type: "item",
            id: item.permissionCode,
            name: item.name,
            operationCount: item.operations.length,
          }),
      })
    }
    return actions
  }
</script>

<svelte:head><title>菜单与权限 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title="菜单与权限"
    description="维护侧边栏结构与显示状态，并管理每个菜单下的操作权限。"
  />

  <ListShell description={menuStats}>
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder="搜索菜单或操作权限…"
          aria-label="搜索菜单"
          bind:value={search}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      {#if saving}
        <span class="text-xs text-muted-foreground">正在保存…</span>
      {/if}
      {#if canViewOverview}
        <Button
          href="/settings/permission"
          variant="outline"
          class="w-full md:w-auto"
        >
          <KeyRound data-icon="inline-start" />
          权限总览
        </Button>
      {/if}
      {#if canCreate}
        <Button
          variant="outline"
          disabled={saving}
          class="w-full md:w-auto"
          onclick={openCreateGroup}
        >
          <Plus data-icon="inline-start" />
          新增分组
        </Button>
      {/if}
      {#if search.trim()}
        <span class="text-xs text-muted-foreground">搜索时暂停拖拽</span>
      {/if}
    {/snippet}

    {#if error && config}
      <InlineError message={error} onRetry={() => void load()} />
    {/if}

    {#if loading}
      <PageFormSkeleton />
    {:else if !config}
      <ErrorState
        message={error || "加载菜单失败"}
        onRetry={() => void load()}
      />
    {:else if config.groups.length === 0}
      <EmptyState
        title="还没有菜单分组"
        description="先创建一个分组，再把菜单入口放进去。"
      >
        {#if canCreate}
          <Button onclick={openCreateGroup}>
            <Plus data-icon="inline-start" />
            新增分组
          </Button>
        {/if}
      </EmptyState>
    {:else if visibleGroups.length === 0}
      <EmptyState
        title="没有匹配的菜单"
        description="换个关键词，或清空搜索条件后再试。"
      >
        <Button variant="outline" onclick={() => (search = "")}>清空搜索</Button
        >
      </EmptyState>
    {:else if isCompact.matches}
      <div class="flex flex-col gap-4">
        {#each visibleGroups as group (group.id)}
          <div class="rounded-xl border bg-card">
            <div class="flex items-center gap-2 border-b p-3">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`${collapsedGroups.has(group.id) ? "展开" : "收起"} ${group.name} 分组`}
                onclick={() => toggleGroup(group.id)}
              >
                <ChevronRight
                  class={collapsedGroups.has(group.id) ? "" : "rotate-90"}
                />
              </Button>
              <span class="font-medium">{group.name}</span>
              <Badge variant="secondary">{group.items.length} 个菜单</Badge>
              <div class="ml-auto flex items-center gap-1">
                {#if reorderEnabled}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`拖动 ${group.name} 排序`}
                    onpointerdown={(event) =>
                      startDrag(event, { type: "group", groupId: group.id })}
                  >
                    <GripVertical />
                  </Button>
                {/if}
                <RowActions
                  actions={buildGroupActions(group)}
                  label={`${group.name} 的操作`}
                />
              </div>
            </div>
            {#if !collapsedGroups.has(group.id)}
              <div class="flex flex-col gap-2 p-3">
                {#each group.items as item, itemIndex (item.permissionCode)}
                  <div class="rounded-lg border p-3">
                    <div class="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${expanded.has(item.permissionCode) ? "收起" : "展开"} ${item.name} 的操作权限`}
                        onclick={() => toggleExpanded(item.permissionCode)}
                      >
                        <ChevronRight
                          class={expanded.has(item.permissionCode)
                            ? "rotate-90"
                            : ""}
                        />
                      </Button>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="truncate text-sm font-medium"
                            >{item.name}</span
                          >
                          {#if item.hidden}<Badge variant="outline"
                              >已隐藏</Badge
                            >{/if}
                        </div>
                        <p
                          class="truncate font-mono text-[11px] text-muted-foreground"
                        >
                          {item.route} · {item.permissionCode}
                        </p>
                      </div>
                      {#if reorderEnabled}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`拖动 ${item.name} 排序`}
                          onpointerdown={(event) =>
                            startDrag(event, {
                              type: "item",
                              groupId: group.id,
                              permissionCode: item.permissionCode,
                            })}
                        >
                          <GripVertical />
                        </Button>
                      {/if}
                      <RowActions
                        actions={buildMenuActions(
                          item,
                          itemIndex,
                          group.items.length
                        )}
                        label={`${item.name} 的操作`}
                      />
                    </div>
                    {#if expanded.has(item.permissionCode)}
                      <div class="mt-2 flex flex-col gap-1 border-t pt-2">
                        {#each item.operations as operation (operation.code)}
                          <div class="flex items-center gap-2 text-xs">
                            <span class="flex-1 truncate">{operation.name}</span
                            >
                            <span class="font-mono text-muted-foreground"
                              >{operation.code}</span
                            >
                            {#if canEditOperation}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`编辑 ${operation.name}`}
                                onclick={() =>
                                  openEditOperation(item, operation)}
                              >
                                <KeyRound />
                              </Button>
                            {/if}
                            {#if canDeleteOperation}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`删除 ${operation.name}`}
                                onclick={() =>
                                  handleDeleteOperation(item, operation)}
                              >
                                <Trash2 />
                              </Button>
                            {/if}
                          </div>
                        {/each}
                        {#if item.operations.length === 0}
                          <span class="text-xs text-muted-foreground"
                            >暂无操作权限</span
                          >
                        {/if}
                        {#if canCreateOperation}
                          <Button
                            variant="ghost"
                            size="sm"
                            class="mt-1 justify-start"
                            onclick={() => openCreateOperation(item)}
                          >
                            <Plus data-icon="inline-start" />
                            新增操作权限
                          </Button>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
                {#if canCreate}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => openCreateItem(group.id)}
                  >
                    <Plus data-icon="inline-start" />
                    新增菜单
                  </Button>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="overflow-clip rounded-xl border bg-card">
        <Table class="min-w-[600px] table-fixed">
          <TableHeader>
            <TableRow class="bg-muted/50 hover:bg-muted/50">
              <TableHead class="w-[35%]">名称</TableHead>
              <TableHead class="w-[10%]">类型</TableHead>
              <TableHead class="w-[27%]">路由 / 权限编码</TableHead>
              <TableHead class="hidden w-[12%] lg:table-cell">标记</TableHead>
              <TableHead class="sticky right-0 w-[16%] bg-muted/50 text-right"
                >操作</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each visibleGroups as group (group.id)}
              <tr data-menu-group={group.id} class="border-b bg-muted/30">
                <td class="p-3">
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${tableCollapsedGroups.has(group.id) ? "展开" : "收起"} ${group.name} 分组`}
                      onclick={() => toggleGroup(group.id)}
                    >
                      <ChevronRight
                        class={tableCollapsedGroups.has(group.id)
                          ? ""
                          : "rotate-90"}
                      />
                    </Button>
                    <span class="font-medium">{group.name}</span>
                  </div>
                </td>
                <td class="p-3"><Badge variant="secondary">分组</Badge></td>
                <td class="p-3 font-mono text-xs text-muted-foreground"
                  >{group.id}</td
                >
                <td
                  class="hidden p-3 text-xs text-muted-foreground lg:table-cell"
                >
                  {group.isSystem ? "内置" : "自定义"}
                </td>
                <td class="sticky right-0 bg-muted/30 p-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if reorderEnabled}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`拖动 ${group.name} 排序`}
                        onpointerdown={(event) =>
                          startDrag(event, {
                            type: "group",
                            groupId: group.id,
                          })}
                      >
                        <GripVertical />
                      </Button>
                    {/if}
                    {#if canCreate}
                      <Button
                        variant="ghost"
                        size="xs"
                        onclick={() => openCreateItem(group.id)}
                      >
                        <Plus /> 新增菜单
                      </Button>
                    {/if}
                    <RowActions
                      actions={buildGroupActions(group)}
                      label={`${group.name} 的操作`}
                    />
                  </div>
                </td>
              </tr>

              {#if !tableCollapsedGroups.has(group.id)}
                {#each group.items as item, itemIndex (item.permissionCode)}
                  <tr
                    data-menu-item={item.permissionCode}
                    data-group-id={group.id}
                    class="border-b"
                  >
                    <td class="p-3">
                      <div class="flex items-center gap-1 pl-4">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${expanded.has(item.permissionCode) ? "收起" : "展开"} ${item.name} 的操作权限`}
                          onclick={() => toggleExpanded(item.permissionCode)}
                        >
                          <ChevronRight
                            class={expanded.has(item.permissionCode)
                              ? "rotate-90"
                              : ""}
                          />
                        </Button>
                        <span class="text-sm font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td class="p-3"><Badge>菜单</Badge></td>
                    <td class="p-3">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-sm">{item.route}</span>
                        <span
                          class="font-mono text-[11px] text-muted-foreground"
                          >{item.permissionCode}</span
                        >
                      </div>
                    </td>
                    <td class="hidden p-3 lg:table-cell">
                      {#if item.hidden}<Badge variant="outline">已隐藏</Badge
                        >{:else}<span class="text-xs text-muted-foreground"
                          >—</span
                        >{/if}
                    </td>
                    <td class="sticky right-0 bg-card p-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        {#if reorderEnabled}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`拖动 ${item.name} 排序`}
                            onpointerdown={(event) =>
                              startDrag(event, {
                                type: "item",
                                groupId: group.id,
                                permissionCode: item.permissionCode,
                              })}
                          >
                            <GripVertical />
                          </Button>
                        {/if}
                        {#if canEdit}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`编辑 ${item.name}`}
                            onclick={() => openEditItem(item)}
                          >
                            <KeyRound />
                          </Button>
                        {/if}
                        <RowActions
                          actions={buildMenuActions(
                            item,
                            itemIndex,
                            group.items.length
                          )}
                          label={`${item.name} 的操作`}
                        />
                      </div>
                    </td>
                  </tr>
                  {#if expanded.has(item.permissionCode)}
                    {#each item.operations as operation (operation.code)}
                      <tr class="border-b bg-muted/10">
                        <td class="p-3 pl-12 text-sm">{operation.name}</td>
                        <td class="p-3"
                          ><Badge variant="secondary">操作</Badge></td
                        >
                        <td class="p-3 font-mono text-xs text-muted-foreground"
                          >{operation.code}</td
                        >
                        <td class="hidden p-3 lg:table-cell"></td>
                        <td class="sticky right-0 bg-muted/10 p-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                            {#if canEditOperation}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`编辑 ${operation.name}`}
                                onclick={() =>
                                  openEditOperation(item, operation)}
                              >
                                <KeyRound />
                              </Button>
                            {/if}
                            {#if canDeleteOperation}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`删除 ${operation.name}`}
                                onclick={() =>
                                  handleDeleteOperation(item, operation)}
                              >
                                <Plus class="rotate-45" />
                              </Button>
                            {/if}
                          </div>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                {/each}
              {/if}
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </ListShell>

  <FormDialog
    bind:open={groupOpen}
    title={editingGroup ? "编辑分组" : "新增分组"}
    description="分组名称仅用于侧边栏展示。"
    {submitting}
    onSubmit={() => void submitGroup()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="group-name">分组名称</FieldLabel>
        <Input
          id="group-name"
          bind:value={groupName}
          name="group-name"
          autocomplete="off"
          required
        />
      </Field>
    </FieldGroup>
  </FormDialog>

  <FormDialog
    bind:open={itemOpen}
    title={editingItem ? "编辑菜单" : "新增菜单"}
    description="菜单路由需要由前端页面提供。"
    {submitting}
    onSubmit={() => void submitItem()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="item-code">权限编码</FieldLabel>
        <Input
          id="item-code"
          bind:value={itemForm.permissionCode}
          name="item-code"
          autocomplete="off"
          spellcheck={false}
          disabled={!!editingItem}
          required
          pattern="^[a-z0-9_.-]+$"
          title="只能包含小写字母、数字、点、下划线和连字符"
        />
      </Field>
      <Field>
        <FieldLabel for="item-name">菜单名称</FieldLabel>
        <Input
          id="item-name"
          bind:value={itemForm.name}
          name="item-name"
          autocomplete="off"
          required
        />
      </Field>
      <Field>
        <FieldLabel>所属分组</FieldLabel>
        <Select
          type="single"
          items={groupItems}
          value={itemForm.groupId}
          onValueChange={(value) => {
            if (value) itemForm.groupId = value
          }}
        >
          <SelectTrigger class="w-full" aria-label="所属分组">
            <SelectValue placeholder="请选择分组" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {#each config?.groups ?? [] as group (group.id)}
                <SelectItem value={group.id}>{group.name}</SelectItem>
              {/each}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel for="item-route">路由</FieldLabel>
        <Input
          id="item-route"
          bind:value={itemForm.route}
          name="item-route"
          autocomplete="off"
          spellcheck={false}
          placeholder="/settings/example"
          required
        />
      </Field>
      <Field>
        <FieldLabel>图标</FieldLabel>
        <IconPicker bind:value={itemForm.icon} />
      </Field>
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="item-visible">在侧边栏显示</FieldLabel>
          <FieldDescription>
            {editingItem?.permissionCode === "menus" ||
            editingItem?.permissionCode === "settings"
              ? "隐藏后仍可通过 /settings/menu 直接访问并重新显示。"
              : "关闭后菜单仍保留权限和路由，只是不在侧边栏展示。"}
          </FieldDescription>
        </div>
        <Switch
          id="item-visible"
          checked={!itemForm.hidden}
          onCheckedChange={(value) => (itemForm.hidden = !value)}
        />
      </Field>
    </FieldGroup>
  </FormDialog>

  <FormDialog
    bind:open={operationOpen}
    title={operationTitle}
    description={operationDescription}
    {submitting}
    onSubmit={() => void submitOperation()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="operation-name">权限名称</FieldLabel>
        <Input
          id="operation-name"
          bind:value={operationForm.name}
          name="operation-name"
          autocomplete="off"
          placeholder="如：新增用户"
          required
        />
      </Field>
      {#if !editingOperation}
        <Field>
          <FieldLabel>常用动作</FieldLabel>
          <Select
            type="single"
            items={operationVerbItems}
            value={operationForm.verb}
            onValueChange={(value) => value && handleOperationVerbChange(value)}
          >
            <SelectTrigger class="w-full" aria-label="常用动作">
              <SelectValue placeholder="选择常用动作" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {#each OPERATION_PRESETS as preset (preset.verb)}
                  <SelectItem value={preset.verb}>{preset.label}</SelectItem>
                {/each}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      {/if}
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="operation-custom">自定义编码</FieldLabel>
          <FieldDescription>关闭时按“菜单编码.动作”自动生成。</FieldDescription>
        </div>
        <Switch
          id="operation-custom"
          checked={operationForm.custom}
          disabled={!!editingOperation}
          onCheckedChange={handleOperationCustomChange}
        />
      </Field>
      <Field>
        <FieldLabel for="operation-code">权限编码</FieldLabel>
        <Input
          id="operation-code"
          bind:value={operationForm.code}
          name="operation-code"
          autocomplete="off"
          spellcheck={false}
          disabled={!operationForm.custom || !!editingOperation}
          required
          pattern="^[a-z0-9_.-]+$"
          title="只能包含小写字母、数字、点、下划线和连字符"
        />
        <FieldDescription
          >编码用于后端鉴权，请与代码中的权限码保持一致。</FieldDescription
        >
      </Field>
    </FieldGroup>
  </FormDialog>

  <ConfirmDeleteDialog
    bind:open={deleteOpen}
    targetName={deleteTarget?.name ?? ""}
    description={deleteDescription}
    loading={deleteLoading}
    onConfirm={() => void confirmDelete()}
  />

  <ConfirmHideDialog
    bind:open={hideOpen}
    targetName={hideConfirmTarget?.name ?? ""}
    loading={hideConfirmLoading}
    onConfirm={() => void handleHideConfirm()}
  />
</div>

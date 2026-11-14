<script lang="ts">
  /* eslint-disable svelte/prefer-svelte-reactivity -- Set/Map/Date 只用于不可变副本或纯计算，不承载响应式状态 */
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
    TableCell,
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
  import { t } from "#lib/i18n.js"
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

  function groupLabel(group: MenuGroup) {
    return group.isSystem
      ? $t(`nav.groups.${group.id}`, { defaultValue: group.name })
      : group.name
  }

  function menuLabel(item: MenuItem) {
    return item.isSystem
      ? $t(`nav.items.${item.permissionCode}`, { defaultValue: item.name })
      : item.name
  }

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
  const operationVerbItems = $derived(
    OPERATION_PRESETS.map((preset) => ({
      value: preset.verb,
      label: $t(`menuPage.verbs.${preset.verb}`, {
        defaultValue: preset.label,
      }),
    }))
  )

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
    return $t("menuPage.listDescription", {
      groups: groups.length,
      menus,
      operations,
    })
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
    error = response.message || $t("menuPage.loadFailed")
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
        toast.error(response.message || $t("menuPage.toasts.saveFailed"))
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
    const snapshot = config ? cloneMenuConfig(config) : null

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

    const onUp = (upEvent?: Event) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      if (upEvent?.type === "pointercancel") {
        // 触屏手势取消时回滚，不保存半途排序
        if (snapshot) config = snapshot
      } else if (dragMoved && config) {
        void persistLayout(config)
      }
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
        toast.error(response.message || $t("menuPage.toasts.operationFailed"))
        return
      }
      groupOpen = false
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(
        editingGroup
          ? $t("menuPage.toasts.groupUpdated")
          : $t("menuPage.toasts.groupCreated")
      )
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
        toast.error(response.message || $t("menuPage.toasts.operationFailed"))
        return
      }
      itemOpen = false
      await load()
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(
        editingItem
          ? $t("menuPage.toasts.menuUpdated")
          : $t("menuPage.toasts.menuCreated")
      )
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
        toast.error(response.message || $t("menuPage.toasts.operationFailed"))
        return false
      }
      if (!(await load())) {
        toast.error($t("menuPage.toasts.hiddenSavedReloadFailed"))
        return false
      }
      window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      toast.success(
        hidden
          ? $t("menuPage.toasts.menuHidden")
          : $t("menuPage.toasts.menuShown")
      )
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
      toast.error($t("menuPage.dialogs.operation.nameRequired"))
      return
    }
    const code = operationForm.code.trim()
    if (!editingOperation && !code) {
      toast.error($t("menuPage.dialogs.operation.codeRequired"))
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
        toast.error(response.message || $t("menuPage.toasts.operationFailed"))
        return
      }
      toast.success(
        editingOperation
          ? $t("menuPage.toasts.operationUpdated")
          : $t("menuPage.toasts.operationCreated")
      )
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
        toast.error(response.message || $t("menuPage.toasts.deleteFailed"))
        return
      }
      deleteOpen = false
      deleteTarget = null
      await load()
      if (target.type !== "operation") {
        window.dispatchEvent(new Event(NAVIGATION_REFRESH_EVENT))
      }
      toast.success($t("menuPage.toasts.deleteSuccess"))
    } finally {
      deleteLoading = false
      saving = false
    }
  }

  const deleteDescription = $derived.by(() => {
    if (deleteTarget?.type === "item") {
      return deleteTarget.operationCount > 0
        ? $t("menuPage.delete.itemWithOperations", {
            count: deleteTarget.operationCount,
          })
        : $t("menuPage.delete.item")
    }
    if (deleteTarget?.type === "operation") {
      return $t("menuPage.delete.operation")
    }
    if (deleteTarget?.type === "group") {
      return $t("menuPage.delete.group")
    }
    return undefined
  })

  const operationTitle = $derived(
    editingOperation
      ? $t("menuPage.dialogs.operation.editTitle")
      : $t("menuPage.dialogs.operation.addTitle")
  )
  const operationDescription = $derived(
    operationMenu
      ? $t("menuPage.dialogs.operation.description", {
          name: menuLabel(operationMenu),
          code: operationMenu.permissionCode,
        })
      : undefined
  )

  function buildGroupActions(group: MenuGroup): RowAction[] {
    const actions: RowAction[] = []
    if (canCreate) {
      actions.push({
        label: $t("menuPage.actions.addMenu"),
        icon: Plus,
        onSelect: () => openCreateItem(group.id),
      })
    }
    if (canEdit) {
      actions.push({
        label: $t("menuPage.actions.editGroup"),
        onSelect: () => openEditGroup(group),
      })
    }
    if (reorderEnabled) {
      actions.push({
        label: $t("menuPage.actions.up"),
        disabled:
          (config?.groups.findIndex((item) => item.id === group.id) ?? 0) <= 0,
        onSelect: () => moveGroup(group.id, -1),
        separatorBefore: true,
      })
      actions.push({
        label: $t("menuPage.actions.down"),
        disabled:
          (config?.groups.findIndex((item) => item.id === group.id) ?? 0) >=
          (config?.groups.length ?? 1) - 1,
        onSelect: () => moveGroup(group.id, 1),
      })
    }
    if (canDelete) {
      actions.push({
        label: $t("menuPage.actions.deleteGroup"),
        destructive: true,
        separatorBefore: true,
        onSelect: () =>
          askDelete({
            type: "group",
            id: group.id,
            name: groupLabel(group),
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
        label: $t("menuPage.addOperation"),
        icon: KeyRound,
        onSelect: () => openCreateOperation(item),
      })
    }
    if (canEdit) {
      actions.push({
        label: $t("menuPage.actions.edit"),
        onSelect: () => openEditItem(item),
      })
      actions.push({
        label: item.hidden
          ? $t("menuPage.actions.showInSidebar")
          : $t("menuPage.actions.hideMenu"),
        onSelect: () => void toggleHidden(item),
      })
    }
    if (reorderEnabled) {
      actions.push({
        label: $t("menuPage.actions.up"),
        disabled: index <= 0,
        onSelect: () => moveItem(item.groupId, item.permissionCode, -1),
        separatorBefore: true,
      })
      actions.push({
        label: $t("menuPage.actions.down"),
        disabled: index >= length - 1,
        onSelect: () => moveItem(item.groupId, item.permissionCode, 1),
      })
    }
    if (canDelete) {
      actions.push({
        label: $t("menuPage.actions.delete"),
        destructive: true,
        separatorBefore: true,
        onSelect: () =>
          askDelete({
            type: "item",
            id: item.permissionCode,
            name: menuLabel(item),
            operationCount: item.operations.length,
          }),
      })
    }
    return actions
  }
</script>

<svelte:head
  ><title>{$t("menuPage.title")} · {$t("pwa.defaultName")}</title></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title={$t("menuPage.title")}
    description={$t("menuPage.description")}
  />

  <ListShell description={menuStats}>
    {#snippet actions()}
      <InputGroup class="w-full md:w-64">
        <InputGroupInput
          name="q"
          autocomplete="off"
          spellcheck={false}
          placeholder={$t("menuPage.searchPlaceholder")}
          aria-label={$t("menuPage.searchAria")}
          bind:value={search}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      {#if saving}
        <span class="text-xs text-muted-foreground"
          >{$t("menuPage.saving")}</span
        >
      {/if}
      {#if canViewOverview}
        <Button
          href="/settings/permission"
          variant="outline"
          class="w-full md:w-auto"
        >
          <KeyRound data-icon="inline-start" />
          {$t("menuPage.overview")}
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
          {$t("menuPage.addGroup")}
        </Button>
      {/if}
      {#if search.trim()}
        <span class="text-xs text-muted-foreground"
          >{$t("menuPage.dragPaused")}</span
        >
      {/if}
    {/snippet}

    {#if error && config}
      <InlineError message={error} onRetry={() => void load()} />
    {/if}

    {#if loading}
      <PageFormSkeleton />
    {:else if !config}
      <ErrorState
        message={error || $t("menuPage.loadFailed")}
        onRetry={() => void load()}
      />
    {:else if config.groups.length === 0}
      <EmptyState
        title={$t("menuPage.emptyGroupTitle")}
        description={$t("menuPage.emptyGroupDescription")}
      >
        {#if canCreate}
          <Button onclick={openCreateGroup}>
            <Plus data-icon="inline-start" />
            {$t("menuPage.addGroup")}
          </Button>
        {/if}
      </EmptyState>
    {:else if visibleGroups.length === 0}
      <EmptyState
        title={$t("menuPage.emptySearchTitle")}
        description={$t("menuPage.emptySearchDescription")}
      >
        <Button variant="outline" onclick={() => (search = "")}
          >{$t("menuPage.clearSearch")}</Button
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
                aria-label={$t("menuPage.aria.toggleGroup", {
                  action: collapsedGroups.has(group.id)
                    ? $t("menuPage.actions.expand")
                    : $t("menuPage.actions.collapse"),
                  name: groupLabel(group),
                })}
                onclick={() => toggleGroup(group.id)}
              >
                <ChevronRight
                  class={collapsedGroups.has(group.id) ? "" : "rotate-90"}
                />
              </Button>
              <span class="font-medium">{groupLabel(group)}</span>
              <Badge variant="secondary"
                >{$t("menuPage.itemCount", {
                  count: group.items.length,
                })}</Badge
              >
              <div class="ml-auto flex items-center gap-1">
                {#if reorderEnabled}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={$t("menuPage.aria.dragGroup", {
                      name: groupLabel(group),
                    })}
                    onpointerdown={(event) =>
                      startDrag(event, { type: "group", groupId: group.id })}
                  >
                    <GripVertical />
                  </Button>
                {/if}
                <RowActions
                  actions={buildGroupActions(group)}
                  label={$t("menuPage.groupActions", {
                    name: groupLabel(group),
                  })}
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
                        aria-label={$t("menuPage.aria.toggleOperations", {
                          action: expanded.has(item.permissionCode)
                            ? $t("menuPage.actions.collapse")
                            : $t("menuPage.actions.expand"),
                          name: menuLabel(item),
                        })}
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
                            >{menuLabel(item)}</span
                          >
                          {#if item.hidden}<Badge variant="outline"
                              >{$t("menuPage.hidden")}</Badge
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
                          aria-label={$t("menuPage.aria.dragItem", {
                            name: menuLabel(item),
                          })}
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
                        label={$t("menuPage.itemActions", {
                          name: menuLabel(item),
                        })}
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
                                aria-label={$t("menuPage.aria.editOperation", {
                                  name: operation.name,
                                })}
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
                                aria-label={$t(
                                  "menuPage.aria.deleteOperation",
                                  {
                                    name: operation.name,
                                  }
                                )}
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
                            >{$t("menuPage.noOperations")}</span
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
                            {$t("menuPage.addOperation")}
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
                    {$t("menuPage.actions.addMenu")}
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
              <TableHead class="w-[35%]"
                >{$t("menuPage.columns.name")}</TableHead
              >
              <TableHead class="w-[10%]"
                >{$t("menuPage.columns.type")}</TableHead
              >
              <TableHead class="w-[27%]"
                >{$t("menuPage.columns.routeOrCode")}</TableHead
              >
              <TableHead class="hidden w-[12%] lg:table-cell"
                >{$t("menuPage.columns.marker")}</TableHead
              >
              <TableHead class="sticky right-0 w-[16%] bg-muted/50 text-right"
                >{$t("menuPage.columns.actions")}</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each visibleGroups as group (group.id)}
              <tr
                data-menu-group={group.id}
                class="border-b bg-muted/40 transition-colors hover:bg-muted/60"
              >
                <TableCell class="p-2">
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={$t("menuPage.aria.toggleGroup", {
                        action: tableCollapsedGroups.has(group.id)
                          ? $t("menuPage.actions.expand")
                          : $t("menuPage.actions.collapse"),
                        name: groupLabel(group),
                      })}
                      onclick={() => toggleGroup(group.id)}
                    >
                      <ChevronRight
                        class={tableCollapsedGroups.has(group.id)
                          ? ""
                          : "rotate-90"}
                      />
                    </Button>
                    <span class="font-medium">{groupLabel(group)}</span>
                  </div>
                </TableCell>
                <TableCell
                  ><Badge variant="secondary">{$t("menuPage.groupType")}</Badge
                  ></TableCell
                >
                <TableCell class="font-mono text-xs text-muted-foreground"
                  >{group.id}</TableCell
                >
                <TableCell
                  class="hidden text-xs text-muted-foreground lg:table-cell"
                >
                  {group.isSystem
                    ? $t("menuPage.builtIn")
                    : $t("rolesPage.custom")}
                </TableCell>
                <TableCell class="sticky right-0 bg-muted/40 text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if reorderEnabled}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={$t("menuPage.aria.dragGroup", {
                          name: groupLabel(group),
                        })}
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
                        <Plus />
                        {$t("menuPage.actions.addMenu")}
                      </Button>
                    {/if}
                    <RowActions
                      actions={buildGroupActions(group)}
                      label={$t("menuPage.groupActions", {
                        name: groupLabel(group),
                      })}
                    />
                  </div>
                </TableCell>
              </tr>

              {#if !tableCollapsedGroups.has(group.id)}
                {#each group.items as item, itemIndex (item.permissionCode)}
                  <tr
                    data-menu-item={item.permissionCode}
                    data-group-id={group.id}
                    class="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell class="p-2">
                      <div class="flex items-center gap-1 pl-4">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={$t("menuPage.aria.toggleOperations", {
                            action: expanded.has(item.permissionCode)
                              ? $t("menuPage.actions.collapse")
                              : $t("menuPage.actions.expand"),
                            name: menuLabel(item),
                          })}
                          onclick={() => toggleExpanded(item.permissionCode)}
                        >
                          <ChevronRight
                            class={expanded.has(item.permissionCode)
                              ? "rotate-90"
                              : ""}
                          />
                        </Button>
                        <span class="text-sm font-medium"
                          >{menuLabel(item)}</span
                        >
                      </div>
                    </TableCell>
                    <TableCell
                      ><Badge>{$t("menuPage.menuType")}</Badge></TableCell
                    >
                    <TableCell>
                      <div class="flex flex-col gap-0.5">
                        <span class="text-sm">{item.route}</span>
                        <span
                          class="font-mono text-[11px] text-muted-foreground"
                          >{item.permissionCode}</span
                        >
                      </div>
                    </TableCell>
                    <TableCell class="hidden lg:table-cell">
                      {#if item.hidden}<Badge variant="outline"
                          >{$t("menuPage.hidden")}</Badge
                        >{:else}<span class="text-xs text-muted-foreground"
                          >—</span
                        >{/if}
                    </TableCell>
                    <TableCell class="sticky right-0 bg-card text-right">
                      <div class="flex items-center justify-end gap-1">
                        {#if reorderEnabled}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={$t("menuPage.aria.dragItem", {
                              name: menuLabel(item),
                            })}
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
                            aria-label={$t("menuPage.aria.editItem", {
                              name: menuLabel(item),
                            })}
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
                          label={$t("menuPage.itemActions", {
                            name: menuLabel(item),
                          })}
                        />
                      </div>
                    </TableCell>
                  </tr>
                  {#if expanded.has(item.permissionCode)}
                    {#each item.operations as operation (operation.code)}
                      <tr
                        class="border-b bg-muted/10 transition-colors last:border-0 hover:bg-muted/20"
                      >
                        <TableCell class="p-2 pl-12 text-sm"
                          >{operation.name}</TableCell
                        >
                        <TableCell
                          ><Badge variant="secondary"
                            >{$t("menuPage.operationType")}</Badge
                          ></TableCell
                        >
                        <TableCell
                          class="font-mono text-xs text-muted-foreground"
                          >{operation.code}</TableCell
                        >
                        <TableCell class="hidden lg:table-cell"></TableCell>
                        <TableCell
                          class="sticky right-0 bg-muted/10 text-right"
                        >
                          <div class="flex items-center justify-end gap-1">
                            {#if canEditOperation}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={$t("menuPage.aria.editOperation", {
                                  name: operation.name,
                                })}
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
                                aria-label={$t(
                                  "menuPage.aria.deleteOperation",
                                  {
                                    name: operation.name,
                                  }
                                )}
                                onclick={() =>
                                  handleDeleteOperation(item, operation)}
                              >
                                <Plus class="rotate-45" />
                              </Button>
                            {/if}
                          </div>
                        </TableCell>
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
    title={editingGroup
      ? $t("menuPage.dialogs.group.editTitle")
      : $t("menuPage.dialogs.group.addTitle")}
    description={$t("menuPage.dialogs.group.description")}
    {submitting}
    onSubmit={() => void submitGroup()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="group-name"
          >{$t("menuPage.dialogs.group.name")}</FieldLabel
        >
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
    title={editingItem
      ? $t("menuPage.dialogs.item.editTitle")
      : $t("menuPage.dialogs.item.addTitle")}
    description={$t("menuPage.dialogs.item.description")}
    {submitting}
    onSubmit={() => void submitItem()}
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="item-code"
          >{$t("menuPage.dialogs.item.code")}</FieldLabel
        >
        <Input
          id="item-code"
          bind:value={itemForm.permissionCode}
          name="item-code"
          autocomplete="off"
          spellcheck={false}
          disabled={!!editingItem}
          required
          pattern="^[a-z0-9_.-]+$"
          title={$t("menuPage.dialogs.item.codePattern")}
        />
      </Field>
      <Field>
        <FieldLabel for="item-name"
          >{$t("menuPage.dialogs.item.name")}</FieldLabel
        >
        <Input
          id="item-name"
          bind:value={itemForm.name}
          name="item-name"
          autocomplete="off"
          required
        />
      </Field>
      <Field>
        <FieldLabel>{$t("menuPage.dialogs.item.group")}</FieldLabel>
        <Select
          type="single"
          items={groupItems}
          value={itemForm.groupId}
          onValueChange={(value) => {
            if (value) itemForm.groupId = value
          }}
        >
          <SelectTrigger
            class="w-full"
            aria-label={$t("menuPage.dialogs.item.group")}
          >
            <SelectValue
              placeholder={$t("menuPage.dialogs.item.selectGroup")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {#each config?.groups ?? [] as group (group.id)}
                <SelectItem value={group.id}>{groupLabel(group)}</SelectItem>
              {/each}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel for="item-route"
          >{$t("menuPage.dialogs.item.route")}</FieldLabel
        >
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
        <FieldLabel>{$t("menuPage.dialogs.item.icon")}</FieldLabel>
        <IconPicker bind:value={itemForm.icon} />
      </Field>
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="item-visible"
            >{$t("menuPage.dialogs.item.visible")}</FieldLabel
          >
          <FieldDescription>
            {editingItem?.permissionCode === "menus" ||
            editingItem?.permissionCode === "settings"
              ? $t("menuPage.dialogs.item.criticalHint")
              : $t("menuPage.dialogs.item.visibleHint")}
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
        <FieldLabel for="operation-name"
          >{$t("menuPage.dialogs.operation.name")}</FieldLabel
        >
        <Input
          id="operation-name"
          bind:value={operationForm.name}
          name="operation-name"
          autocomplete="off"
          placeholder={$t("menuPage.dialogs.operation.namePlaceholder")}
          required
        />
      </Field>
      {#if !editingOperation}
        <Field>
          <FieldLabel>{$t("menuPage.dialogs.operation.preset")}</FieldLabel>
          <Select
            type="single"
            items={operationVerbItems}
            value={operationForm.verb}
            onValueChange={(value) => value && handleOperationVerbChange(value)}
          >
            <SelectTrigger
              class="w-full"
              aria-label={$t("menuPage.dialogs.operation.preset")}
            >
              <SelectValue
                placeholder={$t("menuPage.dialogs.operation.presetPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {#each OPERATION_PRESETS as preset (preset.verb)}
                  <SelectItem value={preset.verb}
                    >{$t(`menuPage.verbs.${preset.verb}`, {
                      defaultValue: preset.label,
                    })}</SelectItem
                  >
                {/each}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      {/if}
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="operation-custom"
            >{$t("menuPage.dialogs.operation.custom")}</FieldLabel
          >
          <FieldDescription
            >{$t("menuPage.dialogs.operation.customHint")}</FieldDescription
          >
        </div>
        <Switch
          id="operation-custom"
          checked={operationForm.custom}
          disabled={!!editingOperation}
          onCheckedChange={handleOperationCustomChange}
        />
      </Field>
      <Field>
        <FieldLabel for="operation-code"
          >{$t("menuPage.dialogs.operation.code")}</FieldLabel
        >
        <Input
          id="operation-code"
          bind:value={operationForm.code}
          name="operation-code"
          autocomplete="off"
          spellcheck={false}
          disabled={!operationForm.custom || !!editingOperation}
          required
          pattern="^[a-z0-9_.-]+$"
          title={$t("menuPage.dialogs.operation.codePattern")}
        />
        <FieldDescription
          >{$t("menuPage.dialogs.operation.codeHint")}</FieldDescription
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
    targetName={hideConfirmTarget ? menuLabel(hideConfirmTarget) : ""}
    loading={hideConfirmLoading}
    onConfirm={() => void handleHideConfirm()}
  />
</div>

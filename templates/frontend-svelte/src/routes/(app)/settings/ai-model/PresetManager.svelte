<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import { SvelteURLSearchParams } from "svelte/reactivity"
  import type { ResolvedPathname } from "$app/types"
  import { Pencil, Plus, Search, Star, Trash2 } from "@lucide/svelte"
  import ConfirmDeleteDialog from "#lib/components/shared/confirm-delete-dialog.svelte"
  import DataList from "#lib/components/shared/data-list.svelte"
  import ColumnToggle from "#lib/components/shared/column-toggle.svelte"
  import DensityToggle from "#lib/components/shared/density-toggle.svelte"
  import FormDialog from "#lib/components/shared/form-dialog.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import RecordCard from "#lib/components/shared/record-card.svelte"
  import RowActions from "#lib/components/shared/row-actions.svelte"
  import type { DataColumn } from "#lib/components/shared/data-column.js"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Field,
    FieldDescription,
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
  import { Switch } from "#lib/components/ui/switch/index.js"
  import { Textarea } from "#lib/components/ui/textarea/index.js"
  import {
    createAiModelPreset,
    deleteAiModelPreset as apiDeleteAiModelPreset,
    getAiModelPresetGroups,
    getAiModelPresets,
    updateAiModelPreset,
  } from "#lib/api/ai-model.js"
  import { useColumnVisibility } from "#lib/hooks/use-column-visibility.svelte.js"
  import { useDebouncedValue } from "#lib/hooks/use-debounced-value.svelte.js"
  import { useTableDensity } from "#lib/hooks/use-table-density.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import type { AiModelPreset } from "#lib/types/ai-model.js"

  const toast = useToast()

  const selectedGroup = $derived(page.url.searchParams.get("presetGroup") ?? "")
  const search = $derived(page.url.searchParams.get("presetQ") ?? "")
  const debouncedSearch = useDebouncedValue(() => search)

  function updatePresetParam(key: "presetQ" | "presetGroup", value: string) {
    const params = new SvelteURLSearchParams(page.url.searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    navigate(params)
  }

  function navigate(params: SvelteURLSearchParams) {
    const search = params.toString()
    void goto(
      `${page.url.pathname}${search ? `?${search}` : ""}${page.url.hash}` as ResolvedPathname,
      { replace: true, reset: false }
    )
  }

  const setSearch = (value: string) => updatePresetParam("presetQ", value)
  const setSelectedGroup = (value: string) =>
    updatePresetParam("presetGroup", value)

  let presets = $state<AiModelPreset[]>([])
  let groups = $state<string[]>([])
  const groupItems = $derived([
    { value: "all", label: "全部分组" },
    ...groups.map((group) => ({ value: group, label: group })),
  ])
  let loading = $state(true)
  let error = $state<string | null>(null)

  let editOpen = $state(false)
  let editingPreset = $state<AiModelPreset | null>(null)
  let editForm = $state({
    group: "",
    alias: "",
    modelName: "",
    apiUrl: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  })
  let editSubmitting = $state(false)

  let deleteOpen = $state(false)
  let deleteTarget = $state<AiModelPreset | null>(null)
  let deleteSubmitting = $state(false)

  let requestId = 0

  async function loadData() {
    const id = ++requestId
    loading = true
    error = null
    const [presetsRes, groupsRes] = await Promise.all([
      getAiModelPresets({
        search: debouncedSearch.value,
        group: selectedGroup,
      }),
      getAiModelPresetGroups(),
    ])
    if (id !== requestId) return
    if (presetsRes.code === 0) presets = presetsRes.data
    else error = presetsRes.message || "加载预设模型失败"
    if (groupsRes.code === 0) groups = groupsRes.data
    loading = false
  }

  $effect(() => {
    void debouncedSearch.value
    void selectedGroup
    void loadData()
  })

  function handleAdd() {
    editingPreset = null
    editForm = {
      group: groups[0] || "",
      alias: "",
      modelName: "",
      apiUrl: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    }
    editOpen = true
  }

  function handleEdit(preset: AiModelPreset) {
    editingPreset = preset
    editForm = {
      group: preset.group,
      alias: preset.alias,
      modelName: preset.modelName,
      apiUrl: preset.apiUrl,
      description: preset.description,
      isActive: preset.isActive,
      sortOrder: preset.sortOrder,
    }
    editOpen = true
  }

  async function handleEditSubmit() {
    editSubmitting = true
    const res = editingPreset
      ? await updateAiModelPreset(editingPreset.id, editForm)
      : await createAiModelPreset(editForm)
    editSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "操作失败")
      return
    }
    toast.success(editingPreset ? "保存成功" : "创建成功")
    editOpen = false
    await loadData()
  }

  function handleDelete(preset: AiModelPreset) {
    deleteTarget = preset
    deleteOpen = true
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteSubmitting = true
    const res = await apiDeleteAiModelPreset(deleteTarget.id)
    deleteSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "删除失败")
      return
    }
    toast.success("删除成功")
    deleteOpen = false
    await loadData()
  }

  function buildPresetActions(preset: AiModelPreset): RowAction[] {
    const actions: RowAction[] = []
    if (auth.hasPermission("ai_models.presets.edit")) {
      actions.push({
        label: "编辑",
        icon: Pencil,
        onSelect: () => handleEdit(preset),
      })
    }
    if (auth.hasPermission("ai_models.presets.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(preset),
      })
    }
    return actions
  }

  function clearFilters() {
    const params = new SvelteURLSearchParams(page.url.searchParams.toString())
    params.delete("presetQ")
    params.delete("presetGroup")
    navigate(params)
  }

  const columns: DataColumn[] = [
    { key: "group", header: "分组", hideable: true },
    { key: "alias", header: "别名" },
    {
      key: "modelName",
      header: "模型名称",
      hideable: true,
      headClass: "hidden md:table-cell",
      cellClass: "hidden md:table-cell",
    },
    {
      key: "apiUrl",
      header: "API 地址",
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass:
        "hidden max-w-[200px] truncate text-muted-foreground lg:table-cell",
    },
    {
      key: "description",
      header: "描述",
      hideable: true,
      headClass: "hidden xl:table-cell",
      cellClass:
        "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
    },
    { key: "status", header: "状态" },
    {
      key: "sort",
      header: "排序",
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "操作",
      pinRight: true,
      headClass: "text-right",
      cellClass: "text-right",
    },
  ]

  const columnState = useColumnVisibility("ai-presets", () => columns)
  const densityState = useTableDensity("ai-presets")
</script>

<ListShell
  class="[&_[data-slot=table-container]]:md:overflow-x-visible"
  description={`共 ${presets.length} 个预设模型`}
>
  {#snippet actions()}
    <Select
      type="single"
      items={groupItems}
      value={selectedGroup || "all"}
      onValueChange={(value) => setSelectedGroup(value === "all" ? "" : value)}
    >
      <SelectTrigger class="w-full md:w-40" aria-label="按分组筛选">
        <SelectValue placeholder="全部分组" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all" label="全部分组">全部分组</SelectItem>
          {#each groups as group (group)}
            <SelectItem value={group} label={group}>{group}</SelectItem>
          {/each}
        </SelectGroup>
      </SelectContent>
    </Select>
    <InputGroup class="w-full md:w-60">
      <InputGroupInput
        name="q"
        autocomplete="off"
        spellcheck={false}
        placeholder="搜索别名或模型名称…"
        aria-label="搜索预设模型"
        value={search}
        oninput={(event) => setSearch(event.currentTarget.value)}
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
    {#if auth.hasPermission("ai_models.presets.create")}
      <Button class="w-full md:w-auto" onclick={handleAdd}>
        <Plus data-icon="inline-start" />
        新增预设
      </Button>
    {/if}
  {/snippet}

  <DataList
    items={presets}
    {loading}
    {error}
    columns={columnState.visibleColumns}
    density={densityState.density}
    skeletonColSpan={8}
    empty={{
      icon: Star,
      title:
        debouncedSearch.value || selectedGroup
          ? "没有匹配的预设"
          : "还没有预设模型",
      description:
        debouncedSearch.value || selectedGroup
          ? "换个关键词或分组再试。"
          : "预设在新增模型时用于快速填充模型名称和接口地址。",
    }}
    onRetry={() => void loadData()}
    onHideColumn={columnState.toggle}
  >
    {#snippet emptyAction()}
      {#if debouncedSearch.value || selectedGroup}
        <Button variant="outline" onclick={clearFilters}>清除筛选</Button>
      {:else if auth.hasPermission("ai_models.presets.create")}
        <Button onclick={handleAdd}>
          <Plus data-icon="inline-start" />
          新增预设
        </Button>
      {/if}
    {/snippet}

    {#snippet card(row: AiModelPreset)}
      <RecordCard title={row.alias} subtitle={row.modelName}>
        {#snippet badges()}
          <Badge variant="outline">{row.group}</Badge>
          <Badge variant={row.isActive ? "success" : "secondary"}>
            {row.isActive ? "启用" : "禁用"}
          </Badge>
        {/snippet}
        {#snippet meta()}
          <span>排序 {row.sortOrder}</span>
        {/snippet}
        {#snippet actions()}
          <RowActions actions={buildPresetActions(row)} />
        {/snippet}
      </RecordCard>
    {/snippet}

    {#snippet cell(key: string, row: AiModelPreset)}
      {#if key === "group"}
        <Badge variant="outline">{row.group}</Badge>
      {:else if key === "alias"}
        <span class="font-medium">{row.alias}</span>
      {:else if key === "modelName"}
        {row.modelName}
      {:else if key === "apiUrl"}
        {row.apiUrl}
      {:else if key === "description"}
        {row.description || "-"}
      {:else if key === "status"}
        <Badge variant={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "启用" : "禁用"}
        </Badge>
      {:else if key === "sort"}
        {row.sortOrder}
      {:else if key === "actions"}
        <div class="flex items-center justify-end gap-1">
          {#if auth.hasPermission("ai_models.presets.edit")}
            <Button
              variant="ghost"
              size="icon-sm"
              onclick={() => handleEdit(row)}
            >
              <Pencil />
              <span class="sr-only">编辑 {row.alias}</span>
            </Button>
          {/if}
          <RowActions
            actions={buildPresetActions(row).filter(
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
  title={editingPreset ? "编辑预设模型" : "新增预设模型"}
  description={editingPreset
    ? "修改预设模型的配置信息。"
    : "填写以下信息添加新的预设模型。"}
  submitting={editSubmitting}
  class="sm:max-w-lg"
  onSubmit={() => void handleEditSubmit()}
>
  <FieldGroup>
    <Field>
      <FieldLabel for="preset-group">分组</FieldLabel>
      <Input
        id="preset-group"
        bind:value={editForm.group}
        name="preset-group"
        autocomplete="off"
        placeholder="例如：DeepSeek、OpenAI"
        required
      />
      <FieldDescription>
        用于分类管理，相同分组的模型会显示在一起。
      </FieldDescription>
    </Field>
    <Field>
      <FieldLabel for="preset-alias">别名</FieldLabel>
      <Input
        id="preset-alias"
        bind:value={editForm.alias}
        name="preset-alias"
        autocomplete="off"
        spellcheck={false}
        placeholder="例如：deepseek-chat"
        required
        pattern="^[a-zA-Z0-9._-]+$"
        title="别名只能包含字母、数字、点、下划线和连字符"
      />
    </Field>
    <Field>
      <FieldLabel for="preset-model-name">模型名称</FieldLabel>
      <Input
        id="preset-model-name"
        bind:value={editForm.modelName}
        name="preset-model-name"
        autocomplete="off"
        spellcheck={false}
        placeholder="例如：deepseek-chat"
        required
      />
    </Field>
    <Field>
      <FieldLabel for="preset-api-url">API 地址</FieldLabel>
      <Input
        id="preset-api-url"
        bind:value={editForm.apiUrl}
        name="preset-api-url"
        autocomplete="off"
        spellcheck={false}
        type="url"
        placeholder="例如：https://api.deepseek.com/v1/chat/completions"
        required
      />
    </Field>
    <Field>
      <FieldLabel for="preset-description">描述</FieldLabel>
      <Textarea
        id="preset-description"
        bind:value={editForm.description}
        name="preset-description"
        autocomplete="off"
        placeholder="请输入模型描述（可选）"
        rows={2}
      />
    </Field>
    <div class="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel for="preset-sort-order">排序</FieldLabel>
        <Input
          id="preset-sort-order"
          value={editForm.sortOrder}
          name="preset-sort-order"
          autocomplete="off"
          type="number"
          min={0}
          oninput={(event) => {
            editForm.sortOrder = Number(event.currentTarget.value) || 0
          }}
        />
      </Field>
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="preset-active">启用</FieldLabel>
          <FieldDescription>
            禁用的预设不会出现在新增模型的快捷选择中。
          </FieldDescription>
        </div>
        <Switch
          id="preset-active"
          bind:checked={editForm.isActive}
          aria-label="启用预设"
        />
      </Field>
    </div>
  </FieldGroup>
</FormDialog>

<ConfirmDeleteDialog
  bind:open={deleteOpen}
  targetName={deleteTarget?.alias ?? ""}
  loading={deleteSubmitting}
  onConfirm={() => void handleDeleteConfirm()}
/>

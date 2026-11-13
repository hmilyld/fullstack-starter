<script lang="ts">
  import { onMount } from "svelte"
  import { SvelteSet, SvelteURLSearchParams } from "svelte/reactivity"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import type { ResolvedPathname } from "$app/types"
  import {
    CheckCircle2,
    Eye,
    EyeOff,
    Pencil,
    Plus,
    Search,
    Star,
    TestTube,
    Trash2,
    XCircle,
  } from "@lucide/svelte"
  import ConfirmDeleteDialog from "#lib/components/shared/confirm-delete-dialog.svelte"
  import DataList from "#lib/components/shared/data-list.svelte"
  import ColumnToggle from "#lib/components/shared/column-toggle.svelte"
  import DensityToggle from "#lib/components/shared/density-toggle.svelte"
  import FormDialog from "#lib/components/shared/form-dialog.svelte"
  import ListShell from "#lib/components/shared/list-shell.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import PasswordInput from "#lib/components/shared/password-input.svelte"
  import RecordCard from "#lib/components/shared/record-card.svelte"
  import RowActions from "#lib/components/shared/row-actions.svelte"
  import TablePagination from "#lib/components/shared/table-pagination.svelte"
  import PresetManager from "./PresetManager.svelte"
  import type { DataColumn } from "#lib/components/shared/data-column.js"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import { Badge } from "#lib/components/ui/badge/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
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
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import { Switch } from "#lib/components/ui/switch/index.js"
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "#lib/components/ui/tabs/index.js"
  import { Textarea } from "#lib/components/ui/textarea/index.js"
  import {
    createAiModel,
    deleteAiModel as apiDeleteAiModel,
    getActiveAiModelPresets,
    getAiModels,
    testAiModel,
    updateAiModel,
  } from "#lib/api/ai-model.js"
  import { useColumnVisibility } from "#lib/hooks/use-column-visibility.svelte.js"
  import { useDebouncedValue } from "#lib/hooks/use-debounced-value.svelte.js"
  import { usePagedList } from "#lib/hooks/use-paged-list.svelte.js"
  import { useTableDensity } from "#lib/hooks/use-table-density.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { useUrlListState } from "#lib/hooks/use-url-list-state.svelte.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import type {
    AiModel,
    AiModelPreset,
    AiModelTestResult,
  } from "#lib/types/ai-model.js"

  const DEFAULT_PAGE_SIZE = 10
  const PAGE_SIZE_OPTIONS = [10, 20, 50]

  function maskApiKey(key: string): string {
    if (!key) return "-"
    if (key.length <= 8) return "****"
    return `${key.slice(0, 4)}****${key.slice(-4)}`
  }

  function groupPresets(presets: AiModelPreset[]) {
    const groups: [string, AiModelPreset[]][] = []
    for (const preset of presets) {
      const existing = groups.find(([group]) => group === preset.group)
      if (existing) existing[1].push(preset)
      else groups.push([preset.group, [preset]])
    }
    return groups
  }

  const toast = useToast()

  const activeTab = $derived(
    page.url.searchParams.get("tab") === "presets" ? "presets" : "models"
  )

  function setActiveTab(value: string) {
    const params = new SvelteURLSearchParams(page.url.searchParams.toString())
    if (value === "models") params.delete("tab")
    else params.set("tab", value)
    const search = params.toString()
    void goto(
      `${page.url.pathname}${search ? `?${search}` : ""}${page.url.hash}` as ResolvedPathname,
      {
        replace: true,
        reset: false,
      }
    )
  }

  const listState = useUrlListState()
  const search = $derived(listState.search)
  const debouncedSearch = useDebouncedValue(() => search)
  let pageSize = $state(DEFAULT_PAGE_SIZE)

  const list = usePagedList<AiModel, { search: string }>({
    fetcher: getAiModels,
    params: () => ({ search: debouncedSearch.value }),
    pageSize: () => pageSize,
    page: () => listState.page,
    onPageChange: listState.setPage,
  })

  let presets = $state<AiModelPreset[]>([])
  const groupedPresets = $derived(groupPresets(presets))
  const presetItems = $derived(
    presets.map((preset) => ({
      value: preset.alias,
      label: preset.description
        ? `${preset.alias} - ${preset.description}`
        : preset.alias,
    }))
  )

  onMount(async () => {
    const res = await getActiveAiModelPresets()
    if (res.code === 0) presets = res.data
  })

  let editOpen = $state(false)
  let editingModel = $state<AiModel | null>(null)
  let editForm = $state({
    alias: "",
    modelName: "",
    apiUrl: "",
    apiKey: "",
    description: "",
    isDefault: false,
  })
  let editSubmitting = $state(false)

  let deleteOpen = $state(false)
  let deleteTarget = $state<AiModel | null>(null)
  let deleteSubmitting = $state(false)

  const visibleKeys = new SvelteSet<string>()
  let testingId = $state<string | null>(null)
  let testResult = $state<AiModelTestResult | null>(null)

  function handleTestDialogChange(open: boolean) {
    if (!open) testResult = null
  }

  function toggleKeyVisibility(id: string) {
    if (visibleKeys.has(id)) visibleKeys.delete(id)
    else visibleKeys.add(id)
  }

  function handleAdd() {
    editingModel = null
    editForm = {
      alias: "",
      modelName: "",
      apiUrl: "",
      apiKey: "",
      description: "",
      isDefault: false,
    }
    editOpen = true
  }

  function handleEdit(model: AiModel) {
    editingModel = model
    editForm = {
      alias: model.alias,
      modelName: model.modelName,
      apiUrl: model.apiUrl,
      apiKey: "",
      description: model.description,
      isDefault: model.isDefault,
    }
    editOpen = true
  }

  function applyPreset(alias: string) {
    const preset = presets.find((item) => item.alias === alias)
    if (!preset) return
    editForm = {
      alias: preset.alias,
      modelName: preset.modelName,
      apiUrl: preset.apiUrl,
      apiKey: "",
      description: preset.description,
      isDefault: false,
    }
  }

  async function handleEditSubmit() {
    editSubmitting = true

    if (editingModel) {
      const payload: Partial<Omit<AiModel, "id">> = {
        alias: editForm.alias,
        modelName: editForm.modelName,
        apiUrl: editForm.apiUrl,
        description: editForm.description,
        isDefault: editForm.isDefault,
      }
      if (editForm.apiKey.trim()) payload.apiKey = editForm.apiKey

      const res = await updateAiModel(editingModel.id, payload)
      editSubmitting = false
      if (res.code !== 0) {
        toast.error(res.message || "保存失败")
        return
      }
      toast.success("保存成功")
    } else {
      const res = await createAiModel({
        alias: editForm.alias,
        modelName: editForm.modelName,
        apiUrl: editForm.apiUrl,
        apiKey: editForm.apiKey,
        description: editForm.description,
        isDefault: editForm.isDefault,
      })
      editSubmitting = false
      if (res.code !== 0) {
        toast.error(res.message || "创建失败")
        return
      }
      toast.success("创建成功")
    }

    editOpen = false
    list.refresh()
  }

  function handleDelete(model: AiModel) {
    deleteTarget = model
    deleteOpen = true
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteSubmitting = true
    const res = await apiDeleteAiModel(deleteTarget.id)
    deleteSubmitting = false
    if (res.code !== 0) {
      toast.error(res.message || "删除失败")
      return
    }
    toast.success("删除成功")
    deleteOpen = false
    list.refresh()
  }

  async function handleTest(model: AiModel) {
    testingId = model.id
    testResult = null
    const res = await testAiModel({ modelId: model.id })
    if (res.code === 0) {
      testResult = res.data
    } else {
      testResult = {
        success: false,
        message: res.message || "测试失败",
        responseTime: null,
        model: null,
      }
    }
    testingId = null
  }

  function buildModelActions(model: AiModel): RowAction[] {
    const actions: RowAction[] = []
    if (auth.hasPermission("ai_models")) {
      actions.push({
        label: testingId === model.id ? "测试中…" : "测试",
        icon: TestTube,
        disabled: testingId === model.id,
        onSelect: () => handleTest(model),
      })
    }
    if (auth.hasPermission("ai_models.edit")) {
      actions.push({
        label: "编辑",
        icon: Pencil,
        onSelect: () => handleEdit(model),
      })
    }
    if (auth.hasPermission("ai_models.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(model),
      })
    }
    return actions
  }

  const columns: DataColumn[] = [
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
      key: "apiKey",
      header: "API Key",
      hideable: true,
      headClass: "hidden xl:table-cell",
      cellClass: "hidden xl:table-cell",
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
      key: "actions",
      header: "操作",
      pinRight: true,
      headClass: "text-right",
      cellClass: "text-right",
    },
  ]

  const columnState = useColumnVisibility("ai-models", () => columns)
  const densityState = useTableDensity("ai-models")
</script>

<svelte:head><title>AI 模型配置 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title="AI 模型配置"
    description="管理系统使用的 AI 模型配置，支持多个模型和自定义别名。"
  />

  <Tabs
    value={activeTab}
    class="w-full"
    onValueChange={(value) => setActiveTab(value)}
  >
    <TabsList>
      <TabsTrigger value="models">模型配置</TabsTrigger>
      <TabsTrigger value="presets">预设模型管理</TabsTrigger>
    </TabsList>

    <TabsContent value="models" class="flex flex-col gap-(--page-gap)">
      <ListShell
        class="[&_[data-slot=table-container]]:md:overflow-x-visible"
        description={`共 ${list.total} 个模型配置`}
      >
        {#snippet actions()}
          <InputGroup class="w-full md:w-64">
            <InputGroupInput
              name="q"
              autocomplete="off"
              spellcheck={false}
              placeholder="搜索别名或模型名称…"
              aria-label="搜索模型"
              value={search}
              oninput={(event) =>
                listState.setSearch(event.currentTarget.value)}
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
          {#if auth.hasPermission("ai_models.create")}
            <Button class="w-full md:w-auto" onclick={handleAdd}>
              <Plus data-icon="inline-start" />
              新增模型
            </Button>
          {/if}
        {/snippet}

        {#snippet footer()}
          {#if list.items.length > 0}
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel="个模型"
              {pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={list.setPage}
              onPageSizeChange={(size) => {
                pageSize = size
                list.setPage(1)
              }}
            />
          {/if}
        {/snippet}

        <DataList
          items={list.items}
          loading={list.loading}
          error={list.error}
          columns={columnState.visibleColumns}
          density={densityState.density}
          skeletonColSpan={7}
          empty={{
            icon: Star,
            title: debouncedSearch.value ? "没有匹配的模型" : "还没有模型配置",
            description: debouncedSearch.value
              ? "换个关键词，或清空搜索条件后再试。"
              : "新增模型后，其他模块即可通过别名调用。",
          }}
          onRetry={list.refresh}
          onHideColumn={columnState.toggle}
        >
          {#snippet emptyAction()}
            {#if debouncedSearch.value}
              <Button variant="outline" onclick={() => listState.setSearch("")}>
                清空搜索
              </Button>
            {:else if auth.hasPermission("ai_models.create")}
              <Button onclick={handleAdd}>
                <Plus data-icon="inline-start" />
                新增模型
              </Button>
            {/if}
          {/snippet}

          {#snippet card(row: AiModel)}
            <RecordCard title={row.alias} subtitle={row.modelName}>
              {#snippet badges()}
                <Badge variant={row.isDefault ? "success" : "secondary"}>
                  {row.isDefault ? "默认" : "普通"}
                </Badge>
              {/snippet}
              {#snippet meta()}
                <span class="max-w-[240px] truncate">{row.apiUrl}</span>
              {/snippet}
              {#snippet actions()}
                <RowActions actions={buildModelActions(row)} />
              {/snippet}
            </RecordCard>
          {/snippet}

          {#snippet cell(key: string, row: AiModel)}
            {#if key === "alias"}
              <span class="font-medium">{row.alias}</span>
            {:else if key === "modelName"}
              {row.modelName}
            {:else if key === "apiUrl"}
              {row.apiUrl}
            {:else if key === "apiKey"}
              <div class="flex items-center gap-2">
                <code class="text-xs">
                  {visibleKeys.has(row.id)
                    ? row.apiKey
                    : maskApiKey(row.apiKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={visibleKeys.has(row.id)
                    ? "隐藏 API Key"
                    : "显示 API Key"}
                  onclick={() => toggleKeyVisibility(row.id)}
                >
                  {#if visibleKeys.has(row.id)}
                    <EyeOff />
                  {:else}
                    <Eye />
                  {/if}
                </Button>
              </div>
            {:else if key === "description"}
              {row.description || "-"}
            {:else if key === "status"}
              <Badge variant={row.isDefault ? "success" : "secondary"}>
                {row.isDefault ? "默认" : "普通"}
              </Badge>
            {:else if key === "actions"}
              <div class="flex items-center justify-end gap-1">
                {#if auth.hasPermission("ai_models.edit")}
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
                  actions={buildModelActions(row).filter(
                    (item) => item.label !== "编辑"
                  )}
                />
              </div>
            {/if}
          {/snippet}
        </DataList>
      </ListShell>
    </TabsContent>

    <TabsContent value="presets" class="flex flex-col gap-(--page-gap)">
      <PresetManager />
    </TabsContent>
  </Tabs>

  <FormDialog
    bind:open={editOpen}
    title={editingModel ? "编辑模型" : "新增模型"}
    description={editingModel
      ? "修改 AI 模型的配置信息。"
      : "填写以下信息添加新的 AI 模型配置，或从预设模型中快速选择。"}
    submitting={editSubmitting}
    class="sm:max-w-lg"
    onSubmit={() => void handleEditSubmit()}
  >
    <FieldGroup>
      {#if !editingModel && groupedPresets.length > 0}
        <Field>
          <FieldLabel>快速选择预设模型</FieldLabel>
          <Select
            type="single"
            items={presetItems}
            value=""
            onValueChange={(value) => applyPreset(value)}
          >
            <SelectTrigger class="w-full" aria-label="快速选择预设模型">
              <SelectValue placeholder="选择常用 AI 模型…" />
            </SelectTrigger>
            <SelectContent>
              {#each groupedPresets as [group, items] (group)}
                <SelectGroup>
                  <SelectLabel>{group}</SelectLabel>
                  {#each items as preset (preset.alias)}
                    <SelectItem
                      value={preset.alias}
                      label={preset.description
                        ? `${preset.alias} - ${preset.description}`
                        : preset.alias}
                    >
                      {preset.description
                        ? `${preset.alias} - ${preset.description}`
                        : preset.alias}
                    </SelectItem>
                  {/each}
                </SelectGroup>
              {/each}
            </SelectContent>
          </Select>
          <FieldDescription>
            选择后将自动填充模型名称和 API 地址，只需填写 API Key。
          </FieldDescription>
        </Field>
      {/if}

      <Field>
        <FieldLabel for="model-alias">别名</FieldLabel>
        <Input
          id="model-alias"
          bind:value={editForm.alias}
          name="model-alias"
          autocomplete="off"
          spellcheck={false}
          placeholder="例如：deepseek-chat"
          required
          pattern="^[a-zA-Z0-9_-]+$"
          title="别名只能包含字母、数字、下划线和连字符"
        />
        <FieldDescription>
          唯一标识符，其他模块通过此别名调用模型。
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel for="model-name">模型名称</FieldLabel>
        <Input
          id="model-name"
          bind:value={editForm.modelName}
          name="model-name"
          autocomplete="off"
          spellcheck={false}
          placeholder="例如：deepseek-chat"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="model-api-url">API 地址</FieldLabel>
        <Input
          id="model-api-url"
          bind:value={editForm.apiUrl}
          name="model-api-url"
          autocomplete="off"
          spellcheck={false}
          type="url"
          placeholder="例如：https://api.deepseek.com/v1/chat/completions"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="model-api-key">API Key</FieldLabel>
        <PasswordInput
          id="model-api-key"
          bind:value={editForm.apiKey}
          placeholder="留空保持不变"
          autocomplete="off"
          required={!editingModel}
        />
      </Field>
      <Field>
        <FieldLabel for="model-description">描述</FieldLabel>
        <Textarea
          id="model-description"
          bind:value={editForm.description}
          name="model-description"
          autocomplete="off"
          placeholder="请输入模型描述（可选）"
          rows={3}
        />
      </Field>
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="model-default">设为默认模型</FieldLabel>
          <FieldDescription>
            默认模型可被其他模块直接调用，无需指定别名。
          </FieldDescription>
        </div>
        <Switch
          id="model-default"
          bind:checked={editForm.isDefault}
          aria-label="设为默认模型"
        />
      </Field>
    </FieldGroup>
  </FormDialog>

  <ConfirmDeleteDialog
    bind:open={deleteOpen}
    targetName={deleteTarget?.alias ?? ""}
    loading={deleteSubmitting}
    onConfirm={() => void handleDeleteConfirm()}
  />

  <Dialog open={testResult !== null} onOpenChange={handleTestDialogChange}>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          {#if testResult?.success}
            <CheckCircle2 class="text-success" />
          {:else}
            <XCircle class="text-destructive" />
          {/if}
          测试结果
        </DialogTitle>
        <DialogDescription>
          {testResult?.success ? "模型配置测试成功。" : "模型配置测试失败。"}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <div class="rounded-lg bg-muted p-4 text-sm">
          {testResult?.message}
        </div>
        {#if testResult?.responseTime != null}
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">响应时间</span>
            <span class="font-medium">{testResult.responseTime} ms</span>
          </div>
        {/if}
        {#if testResult?.model}
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">实际模型</span>
            <span class="font-medium">{testResult.model}</span>
          </div>
        {/if}
      </div>
      <DialogFooter>
        <Button onclick={() => (testResult = null)}>关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>

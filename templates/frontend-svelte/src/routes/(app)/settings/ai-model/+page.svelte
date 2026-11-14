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
  import { t } from "#lib/i18n.js"
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
        toast.error(res.message || $t("aiModelPage.toasts.saveFailed"))
        return
      }
      toast.success($t("aiModelPage.toasts.saveSuccess"))
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
        toast.error(res.message || $t("aiModelPage.toasts.createFailed"))
        return
      }
      toast.success($t("aiModelPage.toasts.createSuccess"))
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
      toast.error(res.message || $t("aiModelPage.toasts.deleteFailed"))
      return
    }
    toast.success($t("aiModelPage.toasts.deleteSuccess"))
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
        message: res.message || $t("aiModelPage.toasts.testFailed"),
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
        label:
          testingId === model.id
            ? $t("aiModelPage.model.testing")
            : $t("aiModelPage.model.test"),
        icon: TestTube,
        disabled: testingId === model.id,
        onSelect: () => handleTest(model),
      })
    }
    if (auth.hasPermission("ai_models.edit")) {
      actions.push({
        label: $t("common.edit"),
        icon: Pencil,
        onSelect: () => handleEdit(model),
      })
    }
    if (auth.hasPermission("ai_models.delete")) {
      actions.push({
        label: $t("common.delete"),
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(model),
      })
    }
    return actions
  }

  const columns: DataColumn[] = $derived([
    { key: "alias", header: $t("aiModelPage.labels.alias") },
    {
      key: "modelName",
      header: $t("aiModelPage.labels.modelName"),
      hideable: true,
      headClass: "hidden md:table-cell",
      cellClass: "hidden md:table-cell",
    },
    {
      key: "apiUrl",
      header: $t("aiModelPage.labels.apiUrl"),
      hideable: true,
      headClass: "hidden lg:table-cell",
      cellClass:
        "hidden max-w-[200px] truncate text-muted-foreground lg:table-cell",
    },
    {
      key: "apiKey",
      header: $t("aiModelPage.labels.apiKey"),
      hideable: true,
      headClass: "hidden xl:table-cell",
      cellClass: "hidden xl:table-cell",
    },
    {
      key: "description",
      header: $t("aiModelPage.labels.description"),
      hideable: true,
      headClass: "hidden xl:table-cell",
      cellClass:
        "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
    },
    { key: "status", header: $t("aiModelPage.labels.status") },
    {
      key: "actions",
      header: $t("aiModelPage.labels.actions"),
      pinRight: true,
      headClass: "text-right",
      cellClass: "text-right",
    },
  ])

  const columnState = useColumnVisibility("ai-models", () => columns)
  const densityState = useTableDensity("ai-models")
</script>

<svelte:head
  ><title>{$t("aiModelPage.title")} · {$t("pwa.defaultName")}</title
  ></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <PageHeader
    title={$t("aiModelPage.title")}
    description={$t("aiModelPage.description")}
  />

  <Tabs
    value={activeTab}
    class="w-full"
    onValueChange={(value) => setActiveTab(value)}
  >
    <TabsList>
      <TabsTrigger value="models">{$t("aiModelPage.tabs.models")}</TabsTrigger>
      <TabsTrigger value="presets">{$t("aiModelPage.tabs.presets")}</TabsTrigger
      >
    </TabsList>

    <TabsContent value="models" class="flex flex-col gap-(--page-gap)">
      <ListShell
        class="[&_[data-slot=table-container]]:md:overflow-x-visible"
        description={$t("aiModelPage.model.listDescription", {
          total: list.total,
        })}
      >
        {#snippet actions()}
          <InputGroup class="w-full md:w-64">
            <InputGroupInput
              name="q"
              autocomplete="off"
              spellcheck={false}
              placeholder={$t("aiModelPage.model.searchPlaceholder")}
              aria-label={$t("aiModelPage.model.searchAria")}
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
              {$t("aiModelPage.model.add")}
            </Button>
          {/if}
        {/snippet}

        {#snippet footer()}
          {#if list.items.length > 0}
            <TablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              itemLabel={$t("aiModelPage.model.entityName")}
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
            title: debouncedSearch.value
              ? $t("aiModelPage.model.emptySearchTitle")
              : $t("aiModelPage.model.emptyTitle"),
            description: debouncedSearch.value
              ? $t("aiModelPage.model.emptySearchDescription")
              : $t("aiModelPage.model.emptyDescription"),
          }}
          onRetry={list.refresh}
          onHideColumn={columnState.toggle}
        >
          {#snippet emptyAction()}
            {#if debouncedSearch.value}
              <Button variant="outline" onclick={() => listState.setSearch("")}>
                {$t("aiModelPage.model.clearSearch")}
              </Button>
            {:else if auth.hasPermission("ai_models.create")}
              <Button onclick={handleAdd}>
                <Plus data-icon="inline-start" />
                {$t("aiModelPage.model.add")}
              </Button>
            {/if}
          {/snippet}

          {#snippet card(row: AiModel)}
            <RecordCard title={row.alias} subtitle={row.modelName}>
              {#snippet badges()}
                <Badge variant={row.isDefault ? "success" : "secondary"}>
                  {row.isDefault
                    ? $t("aiModelPage.labels.default")
                    : $t("aiModelPage.labels.normal")}
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
                    ? $t("aiModelPage.model.hideKey")
                    : $t("aiModelPage.model.showKey")}
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
                {row.isDefault
                  ? $t("aiModelPage.labels.default")
                  : $t("aiModelPage.labels.normal")}
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
                    <span class="sr-only"
                      >{$t("aiModelPage.model.editSrOnly", {
                        name: row.alias,
                      })}</span
                    >
                  </Button>
                {/if}
                <RowActions
                  actions={buildModelActions(row).filter(
                    (item) => item.label !== $t("common.edit")
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
    title={editingModel
      ? $t("aiModelPage.model.form.editTitle")
      : $t("aiModelPage.model.form.addTitle")}
    description={editingModel
      ? $t("aiModelPage.model.form.editDescription")
      : $t("aiModelPage.model.form.addDescription")}
    submitting={editSubmitting}
    class="sm:max-w-lg"
    onSubmit={() => void handleEditSubmit()}
  >
    <FieldGroup>
      {#if !editingModel && groupedPresets.length > 0}
        <Field>
          <FieldLabel>{$t("aiModelPage.model.form.presetLabel")}</FieldLabel>
          <Select
            type="single"
            items={presetItems}
            value=""
            onValueChange={(value) => applyPreset(value)}
          >
            <SelectTrigger
              class="w-full"
              aria-label={$t("aiModelPage.model.form.presetAria")}
            >
              <SelectValue
                placeholder={$t("aiModelPage.model.form.presetPlaceholder")}
              />
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
          <FieldDescription
            >{$t("aiModelPage.model.form.presetHint")}</FieldDescription
          >
        </Field>
      {/if}

      <Field>
        <FieldLabel for="model-alias"
          >{$t("aiModelPage.model.form.alias")}</FieldLabel
        >
        <Input
          id="model-alias"
          bind:value={editForm.alias}
          name="model-alias"
          autocomplete="off"
          spellcheck={false}
          placeholder={$t("aiModelPage.model.form.aliasPlaceholder")}
          required
          pattern="^[a-zA-Z0-9_-]+$"
          title={$t("aiModelPage.model.form.aliasPattern")}
        />
        <FieldDescription
          >{$t("aiModelPage.model.form.aliasHint")}</FieldDescription
        >
      </Field>
      <Field>
        <FieldLabel for="model-name"
          >{$t("aiModelPage.model.form.modelName")}</FieldLabel
        >
        <Input
          id="model-name"
          bind:value={editForm.modelName}
          name="model-name"
          autocomplete="off"
          spellcheck={false}
          placeholder={$t("aiModelPage.model.form.modelNamePlaceholder")}
          required
        />
      </Field>
      <Field>
        <FieldLabel for="model-api-url"
          >{$t("aiModelPage.model.form.apiUrl")}</FieldLabel
        >
        <Input
          id="model-api-url"
          bind:value={editForm.apiUrl}
          name="model-api-url"
          autocomplete="off"
          spellcheck={false}
          type="url"
          placeholder={$t("aiModelPage.model.form.apiUrlPlaceholder")}
          required
        />
      </Field>
      <Field>
        <FieldLabel for="model-api-key"
          >{$t("aiModelPage.model.form.apiKey")}</FieldLabel
        >
        <PasswordInput
          id="model-api-key"
          bind:value={editForm.apiKey}
          placeholder={$t("aiModelPage.model.form.apiKeyKeep")}
          autocomplete="off"
          required={!editingModel}
        />
      </Field>
      <Field>
        <FieldLabel for="model-description"
          >{$t("aiModelPage.model.form.description")}</FieldLabel
        >
        <Textarea
          id="model-description"
          bind:value={editForm.description}
          name="model-description"
          autocomplete="off"
          placeholder={$t("aiModelPage.model.form.descriptionPlaceholder")}
          rows={3}
        />
      </Field>
      <Field orientation="horizontal">
        <div class="flex flex-1 flex-col gap-1">
          <FieldLabel for="model-default"
            >{$t("aiModelPage.model.form.defaultLabel")}</FieldLabel
          >
          <FieldDescription
            >{$t("aiModelPage.model.form.defaultHint")}</FieldDescription
          >
        </div>
        <Switch
          id="model-default"
          bind:checked={editForm.isDefault}
          aria-label={$t("aiModelPage.model.form.defaultLabel")}
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
          {$t("aiModelPage.test.title")}
        </DialogTitle>
        <DialogDescription>
          {testResult?.success
            ? $t("aiModelPage.test.successDescription")
            : $t("aiModelPage.test.failureDescription")}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <div class="rounded-lg bg-muted p-4 text-sm">
          {testResult?.message}
        </div>
        {#if testResult?.responseTime != null}
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground"
              >{$t("aiModelPage.test.responseTime")}</span
            >
            <span class="font-medium">{testResult.responseTime} ms</span>
          </div>
        {/if}
        {#if testResult?.model}
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground"
              >{$t("aiModelPage.test.actualModel")}</span
            >
            <span class="font-medium">{testResult.model}</span>
          </div>
        {/if}
      </div>
      <DialogFooter>
        <Button onclick={() => (testResult = null)}
          >{$t("aiModelPage.test.close")}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>

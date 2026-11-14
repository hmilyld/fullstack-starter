import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TestTubeIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"
import { useSearchParams } from "react-router"

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { ColumnToggle } from "@/components/shared/column-toggle"
import { DensityToggle } from "@/components/shared/density-toggle"
import { DataList, type DataColumn } from "@/components/shared/data-list"
import { FormDialog } from "@/components/shared/form-dialog"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { PasswordInput } from "@/components/shared/password-input"
import { RecordCard } from "@/components/shared/record-card"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TablePagination } from "@/components/shared/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createAiModel,
  createAiModelPreset,
  deleteAiModel as apiDeleteAiModel,
  deleteAiModelPreset as apiDeleteAiModelPreset,
  getActiveAiModelPresets,
  getAiModelPresetGroups,
  getAiModelPresets,
  getAiModels,
  testAiModel,
  updateAiModel,
  updateAiModelPreset,
} from "@/api/ai-model"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useColumnVisibility } from "@/hooks/use-column-visibility"
import { useTableDensity } from "@/hooks/use-table-density"
import { usePagedList } from "@/hooks/use-paged-list"
import { useUrlListState } from "@/hooks/use-url-list-state"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import type {
  AiModel,
  AiModelPreset,
  AiModelTestResult,
} from "@/types/ai-model"

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function maskApiKey(key: string): string {
  if (!key) return "-"
  if (key.length <= 8) return "****"
  return `${key.slice(0, 4)}****${key.slice(-4)}`
}

function groupPresets(presets: AiModelPreset[]) {
  const groups = new Map<string, AiModelPreset[]>()
  for (const preset of presets) {
    const list = groups.get(preset.group) ?? []
    list.push(preset)
    groups.set(preset.group, list)
  }
  return [...groups.entries()]
}

function AiModelPresetManager() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const [presets, setPresets] = React.useState<AiModelPreset[]>([])
  const [groups, setGroups] = React.useState<string[]>([])
  const [presetParams, setPresetParams] = useSearchParams()
  const selectedGroup = presetParams.get("presetGroup") ?? ""
  const search = presetParams.get("presetQ") ?? ""
  const debouncedSearch = useDebouncedValue(search)

  function updatePresetParam(key: "presetQ" | "presetGroup", value: string) {
    setPresetParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true }
    )
  }

  const setSearch = (value: string) => updatePresetParam("presetQ", value)
  const setSelectedGroup = (value: string) =>
    updatePresetParam("presetGroup", value)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [editingPreset, setEditingPreset] =
    React.useState<AiModelPreset | null>(null)
  const [editForm, setEditForm] = React.useState({
    group: "",
    alias: "",
    modelName: "",
    apiUrl: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  })
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<AiModelPreset | null>(
    null
  )
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const requestId = React.useRef(0)

  const loadData = React.useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    const [presetsRes, groupsRes] = await Promise.all([
      getAiModelPresets({
        search: debouncedSearch,
        group: selectedGroup,
      }),
      getAiModelPresetGroups(),
    ])
    if (id !== requestId.current) return
    if (presetsRes.code === 0) setPresets(presetsRes.data)
    else setError(presetsRes.message || t("aiModelPage.toasts.operationFailed"))
    if (groupsRes.code === 0) setGroups(groupsRes.data)
    setLoading(false)
  }, [debouncedSearch, selectedGroup, t])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  function handleAdd() {
    setEditingPreset(null)
    setEditForm({
      group: groups[0] || "",
      alias: "",
      modelName: "",
      apiUrl: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    })
    setEditOpen(true)
  }

  function handleEdit(preset: AiModelPreset) {
    setEditingPreset(preset)
    setEditForm({
      group: preset.group,
      alias: preset.alias,
      modelName: preset.modelName,
      apiUrl: preset.apiUrl,
      description: preset.description,
      isActive: preset.isActive,
      sortOrder: preset.sortOrder,
    })
    setEditOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditSubmitting(true)
    const res = editingPreset
      ? await updateAiModelPreset(editingPreset.id, editForm)
      : await createAiModelPreset(editForm)
    setEditSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("aiModelPage.toasts.operationFailed"))
      return
    }
    appToast.success(
      editingPreset
        ? t("aiModelPage.toasts.saveSuccess")
        : t("aiModelPage.toasts.createSuccess")
    )
    setEditOpen(false)
    void loadData()
  }

  function handleDelete(preset: AiModelPreset) {
    setDeleteTarget(preset)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    const res = await apiDeleteAiModelPreset(deleteTarget.id)
    setDeleteSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("aiModelPage.toasts.deleteFailed"))
      return
    }
    appToast.success(t("aiModelPage.toasts.deleteSuccess"))
    setDeleteOpen(false)
    void loadData()
  }

  function buildPresetActions(preset: AiModelPreset): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("ai_models.presets.edit")) {
      actions.push({
        label: t("common.edit"),
        icon: PencilIcon,
        onSelect: () => handleEdit(preset),
      })
    }
    if (hasPermission("ai_models.presets.delete")) {
      actions.push({
        label: t("common.delete"),
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(preset),
      })
    }
    return actions
  }

  const columns: DataColumn<AiModelPreset>[] = [
    {
      key: "group",
      header: t("aiModelPage.labels.group"),
      hideable: true,
      cell: (preset) => <Badge variant="outline">{preset.group}</Badge>,
    },
    {
      key: "alias",
      header: t("aiModelPage.labels.alias"),
      cell: (preset) => <span className="font-medium">{preset.alias}</span>,
    },
    {
      key: "modelName",
      header: t("aiModelPage.labels.modelName"),
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (preset) => preset.modelName,
    },
    {
      key: "apiUrl",
      header: t("aiModelPage.labels.apiUrl"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName:
        "hidden max-w-[200px] truncate text-muted-foreground lg:table-cell",
      cell: (preset) => preset.apiUrl,
    },
    {
      key: "description",
      header: t("aiModelPage.labels.description"),
      hideable: true,
      headClassName: "hidden xl:table-cell",
      cellClassName:
        "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
      cell: (preset) => preset.description || "-",
    },
    {
      key: "status",
      header: t("aiModelPage.labels.status"),
      cell: (preset) => (
        <Badge variant={preset.isActive ? "success" : "secondary"}>
          {preset.isActive
            ? t("aiModelPage.labels.active")
            : t("aiModelPage.labels.inactive")}
        </Badge>
      ),
    },
    {
      key: "sort",
      header: t("aiModelPage.labels.sort"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      cell: (preset) => preset.sortOrder,
    },
    {
      key: "actions",
      header: t("aiModelPage.labels.actions"),
      pinRight: true,
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (preset) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission("ai_models.presets.edit") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(preset)}
            >
              <PencilIcon />
              <span className="sr-only">
                {t("aiModelPage.preset.editSrOnly", { name: preset.alias })}
              </span>
            </Button>
          )}
          <RowActions
            actions={buildPresetActions(preset).filter(
              (action) => action.label !== t("common.edit")
            )}
          />
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("ai-presets", columns)
  const { density, setDensity } = useTableDensity("ai-presets")

  return (
    <>
      <ListShell
        description={t("aiModelPage.preset.listDescription", {
          total: presets.length,
        })}
        actions={
          <>
            <Select
              value={selectedGroup || "all"}
              onValueChange={(value) =>
                setSelectedGroup(value === "all" ? "" : value)
              }
            >
              <SelectTrigger
                className="w-full md:w-40"
                aria-label={t("aiModelPage.preset.groupFilterAria")}
              >
                <SelectValue placeholder={t("aiModelPage.preset.allGroups")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    {t("aiModelPage.preset.allGroups")}
                  </SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <InputGroup className="w-full md:w-60">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("aiModelPage.preset.searchPlaceholder")}
                aria-label={t("aiModelPage.preset.searchAria")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <ColumnToggle
              columns={columns}
              hidden={table.hidden}
              onToggle={table.toggle}
              onReset={table.reset}
            />
            <DensityToggle density={density} onChange={setDensity} />
            {hasPermission("ai_models.presets.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                {t("aiModelPage.preset.add")}
              </Button>
            )}
          </>
        }
      >
        <DataList
          items={presets}
          loading={loading}
          error={error}
          onRetry={loadData}
          skeletonColSpan={8}
          getKey={(preset) => preset.id}
          onHideColumn={table.toggle}
          empty={{
            icon: StarIcon,
            title:
              debouncedSearch || selectedGroup
                ? t("aiModelPage.preset.emptySearchTitle")
                : t("aiModelPage.preset.emptyTitle"),
            description:
              debouncedSearch || selectedGroup
                ? t("aiModelPage.preset.emptySearchDescription")
                : t("aiModelPage.preset.emptyDescription"),
            action:
              debouncedSearch || selectedGroup ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setSelectedGroup("")
                  }}
                >
                  {t("aiModelPage.preset.clearFilter")}
                </Button>
              ) : hasPermission("ai_models.presets.create") ? (
                <Button onClick={handleAdd}>
                  <PlusIcon data-icon="inline-start" />
                  {t("aiModelPage.preset.add")}
                </Button>
              ) : null,
          }}
          renderCard={(preset) => (
            <RecordCard
              key={preset.id}
              title={preset.alias}
              badges={
                <>
                  <Badge variant="outline">{preset.group}</Badge>
                  <Badge variant={preset.isActive ? "success" : "secondary"}>
                    {preset.isActive
                      ? t("aiModelPage.labels.active")
                      : t("aiModelPage.labels.inactive")}
                  </Badge>
                </>
              }
              subtitle={preset.modelName}
              meta={
                <span>
                  {t("aiModelPage.preset.sortMeta", {
                    order: preset.sortOrder,
                  })}
                </span>
              }
              actions={<RowActions actions={buildPresetActions(preset)} />}
            />
          )}
          columns={table.visibleColumns}
          density={density}
        />
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={
          editingPreset
            ? t("aiModelPage.preset.form.editTitle")
            : t("aiModelPage.preset.form.addTitle")
        }
        description={
          editingPreset
            ? t("aiModelPage.preset.form.editDescription")
            : t("aiModelPage.preset.form.addDescription")
        }
        submitting={editSubmitting}
        className="sm:max-w-lg"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="preset-group">
              {t("aiModelPage.preset.form.group")}
            </FieldLabel>
            <Input
              name="preset-group"
              autoComplete="off"
              id="preset-group"
              placeholder={t("aiModelPage.preset.form.groupPlaceholder")}
              value={editForm.group}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  group: event.target.value,
                }))
              }
              required
            />
            <FieldDescription>
              {t("aiModelPage.preset.form.groupHint")}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-alias">
              {t("aiModelPage.preset.form.alias")}
            </FieldLabel>
            <Input
              name="preset-alias"
              autoComplete="off"
              spellCheck={false}
              id="preset-alias"
              placeholder={t("aiModelPage.preset.form.aliasPlaceholder")}
              value={editForm.alias}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  alias: event.target.value,
                }))
              }
              required
              pattern="^[a-zA-Z0-9._-]+$"
              title={t("aiModelPage.preset.form.aliasPattern")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-model-name">
              {t("aiModelPage.preset.form.modelName")}
            </FieldLabel>
            <Input
              name="preset-model-name"
              autoComplete="off"
              spellCheck={false}
              id="preset-model-name"
              placeholder={t("aiModelPage.preset.form.modelNamePlaceholder")}
              value={editForm.modelName}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  modelName: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-api-url">
              {t("aiModelPage.preset.form.apiUrl")}
            </FieldLabel>
            <Input
              name="preset-api-url"
              autoComplete="off"
              spellCheck={false}
              id="preset-api-url"
              type="url"
              placeholder={t("aiModelPage.preset.form.apiUrlPlaceholder")}
              value={editForm.apiUrl}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  apiUrl: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-description">
              {t("aiModelPage.preset.form.description")}
            </FieldLabel>
            <Textarea
              name="preset-description"
              autoComplete="off"
              id="preset-description"
              placeholder={t("aiModelPage.preset.form.descriptionPlaceholder")}
              value={editForm.description}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  description: event.target.value,
                }))
              }
              rows={2}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="preset-sort-order">
                {t("aiModelPage.preset.form.sortOrder")}
              </FieldLabel>
              <Input
                name="preset-sort-order"
                autoComplete="off"
                id="preset-sort-order"
                type="number"
                min={0}
                value={editForm.sortOrder}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    sortOrder: event.target.value
                      ? Number(event.target.value)
                      : 0,
                  }))
                }
              />
            </Field>
            <Field orientation="horizontal">
              <div className="flex flex-1 flex-col gap-1">
                <FieldLabel htmlFor="preset-active">
                  {t("aiModelPage.preset.form.active")}
                </FieldLabel>
                <FieldDescription>
                  {t("aiModelPage.preset.form.activeHint")}
                </FieldDescription>
              </div>
              <Switch
                id="preset-active"
                aria-label={t("aiModelPage.preset.form.activeAria")}
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm((form) => ({ ...form, isActive: checked }))
                }
              />
            </Field>
          </div>
        </FieldGroup>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.alias ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </>
  )
}

export function AiModelPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") === "presets" ? "presets" : "models"

  function setActiveTab(value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === "models") next.delete("tab")
        else next.set("tab", value)
        return next
      },
      { replace: true }
    )
  }

  const { search, page, setSearch, setPage } = useUrlListState()
  const debouncedSearch = useDebouncedValue(search)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const list = usePagedList<AiModel, { search: string }>({
    fetcher: getAiModels,
    params: { search: debouncedSearch },
    pageSize,
    page,
    onPageChange: setPage,
  })

  const [presets, setPresets] = React.useState<AiModelPreset[]>([])

  React.useEffect(() => {
    let cancelled = false
    getActiveAiModelPresets().then((res) => {
      if (!cancelled && res.code === 0) setPresets(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [editOpen, setEditOpen] = React.useState(false)
  const [editingModel, setEditingModel] = React.useState<AiModel | null>(null)
  const [editForm, setEditForm] = React.useState({
    alias: "",
    modelName: "",
    apiUrl: "",
    apiKey: "",
    description: "",
    isDefault: false,
  })
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<AiModel | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set())
  const [testingId, setTestingId] = React.useState<string | null>(null)
  const [testResult, setTestResult] = React.useState<AiModelTestResult | null>(
    null
  )

  function toggleKeyVisibility(id: string) {
    setVisibleKeys((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAdd() {
    setEditingModel(null)
    setEditForm({
      alias: "",
      modelName: "",
      apiUrl: "",
      apiKey: "",
      description: "",
      isDefault: false,
    })
    setEditOpen(true)
  }

  function handleEdit(model: AiModel) {
    setEditingModel(model)
    setEditForm({
      alias: model.alias,
      modelName: model.modelName,
      apiUrl: model.apiUrl,
      apiKey: "",
      description: model.description,
      isDefault: model.isDefault,
    })
    setEditOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEditSubmitting(true)

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
      setEditSubmitting(false)
      if (res.code !== 0) {
        appToast.error(res.message || t("aiModelPage.toasts.saveFailed"))
        return
      }
      appToast.success(t("aiModelPage.toasts.saveSuccess"))
    } else {
      const res = await createAiModel({
        alias: editForm.alias,
        modelName: editForm.modelName,
        apiUrl: editForm.apiUrl,
        apiKey: editForm.apiKey,
        description: editForm.description,
        isDefault: editForm.isDefault,
      })
      setEditSubmitting(false)
      if (res.code !== 0) {
        appToast.error(res.message || t("aiModelPage.toasts.createFailed"))
        return
      }
      appToast.success(t("aiModelPage.toasts.createSuccess"))
    }

    setEditOpen(false)
    list.refresh()
  }

  function handleDelete(model: AiModel) {
    setDeleteTarget(model)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    const res = await apiDeleteAiModel(deleteTarget.id)
    setDeleteSubmitting(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("aiModelPage.toasts.deleteFailed"))
      return
    }
    appToast.success(t("aiModelPage.toasts.deleteSuccess"))
    setDeleteOpen(false)
    list.refresh()
  }

  async function handleTest(model: AiModel) {
    setTestingId(model.id)
    setTestResult(null)
    const res = await testAiModel({ modelId: model.id })
    if (res.code === 0) {
      setTestResult(res.data)
    } else {
      setTestResult({
        success: false,
        message: res.message || t("aiModelPage.toasts.testFailed"),
        responseTime: null,
        model: null,
      })
    }
    setTestingId(null)
  }

  function buildModelActions(model: AiModel): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("ai_models")) {
      actions.push({
        label:
          testingId === model.id
            ? t("aiModelPage.model.testing")
            : t("aiModelPage.model.test"),
        icon: TestTubeIcon,
        disabled: testingId === model.id,
        onSelect: () => handleTest(model),
      })
    }
    if (hasPermission("ai_models.edit")) {
      actions.push({
        label: t("common.edit"),
        icon: PencilIcon,
        onSelect: () => handleEdit(model),
      })
    }
    if (hasPermission("ai_models.delete")) {
      actions.push({
        label: t("common.delete"),
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(model),
      })
    }
    return actions
  }

  const groupedPresets = React.useMemo(() => groupPresets(presets), [presets])

  const columns: DataColumn<AiModel>[] = [
    {
      key: "alias",
      header: t("aiModelPage.labels.alias"),
      cell: (model) => <span className="font-medium">{model.alias}</span>,
    },
    {
      key: "modelName",
      header: t("aiModelPage.labels.modelName"),
      hideable: true,
      headClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
      cell: (model) => model.modelName,
    },
    {
      key: "apiUrl",
      header: t("aiModelPage.labels.apiUrl"),
      hideable: true,
      headClassName: "hidden lg:table-cell",
      cellClassName:
        "hidden max-w-[200px] truncate text-muted-foreground lg:table-cell",
      cell: (model) => model.apiUrl,
    },
    {
      key: "apiKey",
      header: t("aiModelPage.labels.apiKey"),
      hideable: true,
      headClassName: "hidden xl:table-cell",
      cellClassName: "hidden xl:table-cell",
      cell: (model) => (
        <div className="flex items-center gap-2">
          <code className="text-xs">
            {visibleKeys.has(model.id)
              ? model.apiKey
              : maskApiKey(model.apiKey)}
          </code>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={
              visibleKeys.has(model.id)
                ? t("aiModelPage.model.hideKey")
                : t("aiModelPage.model.showKey")
            }
            onClick={() => toggleKeyVisibility(model.id)}
          >
            {visibleKeys.has(model.id) ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
      ),
    },
    {
      key: "description",
      header: t("aiModelPage.labels.description"),
      hideable: true,
      headClassName: "hidden xl:table-cell",
      cellClassName:
        "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
      cell: (model) => model.description || "-",
    },
    {
      key: "status",
      header: t("aiModelPage.labels.status"),
      cell: (model) => (
        <Badge variant={model.isDefault ? "success" : "secondary"}>
          {model.isDefault
            ? t("aiModelPage.labels.default")
            : t("aiModelPage.labels.normal")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("aiModelPage.labels.actions"),
      pinRight: true,
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (model) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission("ai_models.edit") && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(model)}
            >
              <PencilIcon />
              <span className="sr-only">
                {t("aiModelPage.model.editSrOnly", { name: model.alias })}
              </span>
            </Button>
          )}
          <RowActions
            actions={buildModelActions(model).filter(
              (action) => action.label !== t("common.edit")
            )}
          />
        </div>
      ),
    },
  ]

  const table = useColumnVisibility("ai-models", columns)
  const { density, setDensity } = useTableDensity("ai-models")
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("aiModelPage.title")}
        description={t("aiModelPage.description")}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="models">
            {t("aiModelPage.tabs.models")}
          </TabsTrigger>
          <TabsTrigger value="presets">
            {t("aiModelPage.tabs.presets")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="flex flex-col gap-(--page-gap)">
          <ListShell
            description={t("aiModelPage.model.listDescription", {
              total: list.total,
            })}
            actions={
              <>
                <InputGroup className="w-full md:w-64">
                  <InputGroupInput
                    name="q"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={t("aiModelPage.model.searchPlaceholder")}
                    aria-label={t("aiModelPage.model.searchAria")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
                <ColumnToggle
                  columns={columns}
                  hidden={table.hidden}
                  onToggle={table.toggle}
                  onReset={table.reset}
                />
                <DensityToggle density={density} onChange={setDensity} />
                {hasPermission("ai_models.create") && (
                  <Button onClick={handleAdd} className="w-full md:w-auto">
                    <PlusIcon data-icon="inline-start" />
                    {t("aiModelPage.model.add")}
                  </Button>
                )}
              </>
            }
            footer={
              list.items.length > 0 ? (
                <TablePagination
                  page={list.page}
                  totalPages={list.totalPages}
                  total={list.total}
                  itemLabel={t("aiModelPage.model.entityName")}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                  onPageChange={list.setPage}
                />
              ) : null
            }
          >
            <DataList
              items={list.items}
              loading={list.loading}
              error={list.error}
              onRetry={list.refresh}
              skeletonColSpan={7}
              getKey={(model) => model.id}
              onHideColumn={table.toggle}
              empty={{
                icon: StarIcon,
                title: debouncedSearch
                  ? t("aiModelPage.model.emptySearchTitle")
                  : t("aiModelPage.model.emptyTitle"),
                description: debouncedSearch
                  ? t("aiModelPage.model.emptySearchDescription")
                  : t("aiModelPage.model.emptyDescription"),
                action: debouncedSearch ? (
                  <Button variant="outline" onClick={() => setSearch("")}>
                    {t("aiModelPage.model.clearSearch")}
                  </Button>
                ) : hasPermission("ai_models.create") ? (
                  <Button onClick={handleAdd}>
                    <PlusIcon data-icon="inline-start" />
                    {t("aiModelPage.model.add")}
                  </Button>
                ) : null,
              }}
              renderCard={(model) => (
                <RecordCard
                  key={model.id}
                  title={model.alias}
                  badges={
                    <Badge variant={model.isDefault ? "success" : "secondary"}>
                      {model.isDefault
                        ? t("aiModelPage.labels.default")
                        : t("aiModelPage.labels.normal")}
                    </Badge>
                  }
                  subtitle={model.modelName}
                  meta={
                    <span className="max-w-[240px] truncate">
                      {model.apiUrl}
                    </span>
                  }
                  actions={<RowActions actions={buildModelActions(model)} />}
                />
              )}
              columns={table.visibleColumns}
              density={density}
            />
          </ListShell>
        </TabsContent>

        <TabsContent value="presets" className="flex flex-col gap-(--page-gap)">
          <AiModelPresetManager />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={
          editingModel
            ? t("aiModelPage.model.form.editTitle")
            : t("aiModelPage.model.form.addTitle")
        }
        description={
          editingModel
            ? t("aiModelPage.model.form.editDescription")
            : t("aiModelPage.model.form.addDescription")
        }
        submitting={editSubmitting}
        className="sm:max-w-lg"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          {!editingModel && groupedPresets.length > 0 && (
            <Field>
              <FieldLabel>{t("aiModelPage.model.form.presetLabel")}</FieldLabel>
              <Select
                value=""
                onValueChange={(value) => {
                  const preset = presets.find((item) => item.alias === value)
                  if (!preset) return
                  setEditForm({
                    alias: preset.alias,
                    modelName: preset.modelName,
                    apiUrl: preset.apiUrl,
                    apiKey: "",
                    description: preset.description,
                    isDefault: false,
                  })
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-label={t("aiModelPage.model.form.presetAria")}
                >
                  <SelectValue
                    placeholder={t("aiModelPage.model.form.presetPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {groupedPresets.map(([group, items]) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {items.map((preset) => (
                        <SelectItem key={preset.alias} value={preset.alias}>
                          {preset.description
                            ? `${preset.alias} - ${preset.description}`
                            : preset.alias}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {t("aiModelPage.model.form.presetHint")}
              </FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="model-alias">
              {t("aiModelPage.model.form.alias")}
            </FieldLabel>
            <Input
              name="model-alias"
              autoComplete="off"
              spellCheck={false}
              id="model-alias"
              placeholder={t("aiModelPage.model.form.aliasPlaceholder")}
              value={editForm.alias}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  alias: event.target.value,
                }))
              }
              required
              pattern="^[a-zA-Z0-9_-]+$"
              title={t("aiModelPage.model.form.aliasPattern")}
            />
            <FieldDescription>
              {t("aiModelPage.model.form.aliasHint")}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="model-name">
              {t("aiModelPage.model.form.modelName")}
            </FieldLabel>
            <Input
              name="model-name"
              autoComplete="off"
              spellCheck={false}
              id="model-name"
              placeholder={t("aiModelPage.model.form.modelNamePlaceholder")}
              value={editForm.modelName}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  modelName: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="model-api-url">
              {t("aiModelPage.model.form.apiUrl")}
            </FieldLabel>
            <Input
              name="model-api-url"
              autoComplete="off"
              spellCheck={false}
              id="model-api-url"
              type="url"
              placeholder={t("aiModelPage.model.form.apiUrlPlaceholder")}
              value={editForm.apiUrl}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  apiUrl: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="model-api-key">
              {t("aiModelPage.model.form.apiKey")}
            </FieldLabel>
            <PasswordInput
              id="model-api-key"
              placeholder={
                editingModel
                  ? t("aiModelPage.model.form.apiKeyKeep")
                  : t("aiModelPage.model.form.apiKeyPlaceholder")
              }
              autoComplete="off"
              value={editForm.apiKey}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  apiKey: event.target.value,
                }))
              }
              required={!editingModel}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="model-description">
              {t("aiModelPage.model.form.description")}
            </FieldLabel>
            <Textarea
              name="model-description"
              autoComplete="off"
              id="model-description"
              placeholder={t("aiModelPage.model.form.descriptionPlaceholder")}
              value={editForm.description}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  description: event.target.value,
                }))
              }
              rows={3}
            />
          </Field>
          <Field orientation="horizontal">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel htmlFor="model-default">
                {t("aiModelPage.model.form.defaultLabel")}
              </FieldLabel>
              <FieldDescription>
                {t("aiModelPage.model.form.defaultHint")}
              </FieldDescription>
            </div>
            <Switch
              id="model-default"
              aria-label={t("aiModelPage.model.form.defaultLabel")}
              checked={editForm.isDefault}
              onCheckedChange={(checked) =>
                setEditForm((form) => ({ ...form, isDefault: checked }))
              }
            />
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.alias ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />

      <Dialog
        open={testResult !== null}
        onOpenChange={(open) => {
          if (!open) setTestResult(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {testResult?.success ? (
                <CheckCircle2Icon className="text-success" />
              ) : (
                <XCircleIcon className="text-destructive" />
              )}
              {t("aiModelPage.test.title")}
            </DialogTitle>
            <DialogDescription>
              {testResult?.success
                ? t("aiModelPage.test.successDescription")
                : t("aiModelPage.test.failureDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              {testResult?.message}
            </div>
            {testResult?.responseTime != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("aiModelPage.test.responseTime")}
                </span>
                <span className="font-medium">
                  {testResult.responseTime} ms
                </span>
              </div>
            )}
            {testResult?.model && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("aiModelPage.test.actualModel")}
                </span>
                <span className="font-medium">{testResult.model}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTestResult(null)}>
              {t("aiModelPage.test.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

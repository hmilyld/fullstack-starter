import * as React from "react"
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
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { FormDialog } from "@/components/shared/form-dialog"
import { InlineError } from "@/components/shared/inline-error"
import { ListShell } from "@/components/shared/list-shell"
import { PageHeader } from "@/components/shared/page-header"
import { PasswordInput } from "@/components/shared/password-input"
import { RecordCard } from "@/components/shared/record-card"
import { RowActions, type RowAction } from "@/components/shared/row-actions"
import { TablePagination } from "@/components/shared/table-pagination"
import { TableSkeletonRow } from "@/components/shared/table-states"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { usePagedList } from "@/hooks/use-paged-list"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import type {
  AiModel,
  AiModelPreset,
  AiModelTestResult,
} from "@/types/ai-model"

const PAGE_SIZE = 10

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
  const { hasPermission } = useAuth()
  const [presets, setPresets] = React.useState<AiModelPreset[]>([])
  const [groups, setGroups] = React.useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = React.useState("")
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search)
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
    else setError(presetsRes.message || "加载预设模型失败")
    if (groupsRes.code === 0) setGroups(groupsRes.data)
    setLoading(false)
  }, [debouncedSearch, selectedGroup])

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
      appToast.error(res.message || "操作失败")
      return
    }
    appToast.success(editingPreset ? "保存成功" : "创建成功")
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
      appToast.error(res.message || "删除失败")
      return
    }
    appToast.success("删除成功")
    setDeleteOpen(false)
    void loadData()
  }

  function buildPresetActions(preset: AiModelPreset): RowAction[] {
    const actions: RowAction[] = []
    if (hasPermission("ai_models.presets.edit")) {
      actions.push({
        label: "编辑",
        icon: PencilIcon,
        onSelect: () => handleEdit(preset),
      })
    }
    if (hasPermission("ai_models.presets.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(preset),
      })
    }
    return actions
  }

  const hasPresets = presets.length > 0
  const showEmpty = !loading && !hasPresets

  return (
    <>
      <ListShell
        title="预设模型列表"
        description={`共 ${presets.length} 个预设模型`}
        actions={
          <>
            <Select
              value={selectedGroup || "all"}
              onValueChange={(value) =>
                setSelectedGroup(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-full md:w-40" aria-label="按分组筛选">
                <SelectValue placeholder="全部分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部分组</SelectItem>
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
                placeholder="搜索别名或模型名称…"
                aria-label="搜索预设模型"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            {hasPermission("ai_models.presets.create") && (
              <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusIcon data-icon="inline-start" />
                新增预设
              </Button>
            )}
          </>
        }
      >
        {error && hasPresets && (
          <InlineError message={error} onRetry={loadData} />
        )}

        {loading ? (
          <TableSkeletonRow colSpan={8} />
        ) : error && !hasPresets ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : showEmpty ? (
          <EmptyState
            icon={StarIcon}
            title={
              debouncedSearch || selectedGroup
                ? "没有匹配的预设"
                : "还没有预设模型"
            }
            description={
              debouncedSearch || selectedGroup
                ? "换个关键词或分组再试。"
                : "预设在新增模型时用于快速填充模型名称和接口地址。"
            }
            action={
              debouncedSearch || selectedGroup ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setSelectedGroup("")
                  }}
                >
                  清除筛选
                </Button>
              ) : hasPermission("ai_models.presets.create") ? (
                <Button onClick={handleAdd}>
                  <PlusIcon data-icon="inline-start" />
                  新增预设
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 md:hidden">
              {presets.map((preset) => (
                <RecordCard
                  key={preset.id}
                  title={preset.alias}
                  badges={
                    <>
                      <Badge variant="outline">{preset.group}</Badge>
                      <Badge
                        variant={preset.isActive ? "success" : "secondary"}
                      >
                        {preset.isActive ? "启用" : "禁用"}
                      </Badge>
                    </>
                  }
                  subtitle={preset.modelName}
                  meta={<span>排序 {preset.sortOrder}</span>}
                  actions={<RowActions actions={buildPresetActions(preset)} />}
                />
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分组</TableHead>
                    <TableHead>别名</TableHead>
                    <TableHead className="hidden md:table-cell">
                      模型名称
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      API 地址
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden lg:table-cell">排序</TableHead>
                    <TableHead className="sticky right-0 bg-card text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presets.map((preset) => (
                    <TableRow key={preset.id}>
                      <TableCell>
                        <Badge variant="outline">{preset.group}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {preset.alias}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {preset.modelName}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                        {preset.apiUrl}
                      </TableCell>
                      <TableCell className="hidden max-w-[150px] truncate text-muted-foreground xl:table-cell">
                        {preset.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={preset.isActive ? "success" : "secondary"}
                        >
                          {preset.isActive ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {preset.sortOrder}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-inherit text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission("ai_models.presets.edit") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(preset)}
                            >
                              <PencilIcon />
                              <span className="sr-only">
                                编辑 {preset.alias}
                              </span>
                            </Button>
                          )}
                          {hasPermission("ai_models.presets.delete") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(preset)}
                            >
                              <Trash2Icon />
                              <span className="sr-only">
                                删除 {preset.alias}
                              </span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ListShell>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingPreset ? "编辑预设模型" : "新增预设模型"}
        description={
          editingPreset
            ? "修改预设模型的配置信息。"
            : "填写以下信息添加新的预设模型。"
        }
        submitting={editSubmitting}
        className="sm:max-w-lg"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="preset-group">分组</FieldLabel>
            <Input
              id="preset-group"
              placeholder="例如：DeepSeek、OpenAI"
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
              用于分类管理，相同分组的模型会显示在一起。
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-alias">别名</FieldLabel>
            <Input
              id="preset-alias"
              placeholder="例如：deepseek-chat"
              value={editForm.alias}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  alias: event.target.value,
                }))
              }
              required
              pattern="^[a-zA-Z0-9._-]+$"
              title="别名只能包含字母、数字、点、下划线和连字符"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preset-model-name">模型名称</FieldLabel>
            <Input
              id="preset-model-name"
              placeholder="例如：deepseek-chat"
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
            <FieldLabel htmlFor="preset-api-url">API 地址</FieldLabel>
            <Input
              id="preset-api-url"
              type="url"
              placeholder="例如：https://api.deepseek.com/v1/chat/completions"
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
            <FieldLabel htmlFor="preset-description">描述</FieldLabel>
            <Textarea
              id="preset-description"
              placeholder="请输入模型描述（可选）"
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
              <FieldLabel htmlFor="preset-sort-order">排序</FieldLabel>
              <Input
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
                <FieldLabel htmlFor="preset-active">启用</FieldLabel>
                <FieldDescription>
                  禁用的预设不会出现在新增模型的快捷选择中。
                </FieldDescription>
              </div>
              <Switch
                id="preset-active"
                aria-label="启用预设"
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
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") === "presets" ? "presets" : "models"

  function setActiveTab(value: string) {
    setSearchParams(value === "models" ? {} : { tab: value }, {
      replace: true,
    })
  }

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search)
  const list = usePagedList<AiModel, { search: string }>({
    fetcher: getAiModels,
    params: { search: debouncedSearch },
    pageSize: PAGE_SIZE,
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
        appToast.error(res.message || "保存失败")
        return
      }
      appToast.success("保存成功")
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
        appToast.error(res.message || "创建失败")
        return
      }
      appToast.success("创建成功")
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
      appToast.error(res.message || "删除失败")
      return
    }
    appToast.success("删除成功")
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
        message: res.message || "测试失败",
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
        label: testingId === model.id ? "测试中…" : "测试",
        icon: TestTubeIcon,
        disabled: testingId === model.id,
        onSelect: () => handleTest(model),
      })
    }
    if (hasPermission("ai_models.edit")) {
      actions.push({
        label: "编辑",
        icon: PencilIcon,
        onSelect: () => handleEdit(model),
      })
    }
    if (hasPermission("ai_models.delete")) {
      actions.push({
        label: "删除",
        icon: Trash2Icon,
        destructive: true,
        separatorBefore: true,
        onSelect: () => handleDelete(model),
      })
    }
    return actions
  }

  const groupedPresets = React.useMemo(() => groupPresets(presets), [presets])
  const hasModels = list.items.length > 0
  const showEmpty = !list.loading && !hasModels

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="AI 模型配置"
        description="管理系统使用的 AI 模型配置，支持多个模型和自定义别名。"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="models">模型配置</TabsTrigger>
          <TabsTrigger value="presets">预设模型管理</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="flex flex-col gap-(--page-gap)">
          <ListShell
            title="模型列表"
            description={`共 ${list.total} 个模型配置`}
            actions={
              <>
                <InputGroup className="w-full md:w-64">
                  <InputGroupInput
                    placeholder="搜索别名或模型名称…"
                    aria-label="搜索模型"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
                {hasPermission("ai_models.create") && (
                  <Button onClick={handleAdd} className="w-full md:w-auto">
                    <PlusIcon data-icon="inline-start" />
                    新增模型
                  </Button>
                )}
              </>
            }
            footer={
              hasModels ? (
                <TablePagination
                  page={list.page}
                  totalPages={list.totalPages}
                  total={list.total}
                  itemLabel="个模型"
                  onPageChange={list.setPage}
                />
              ) : null
            }
          >
            {list.error && hasModels && (
              <InlineError message={list.error} onRetry={list.refresh} />
            )}

            {list.loading && !hasModels ? (
              <TableSkeletonRow colSpan={7} />
            ) : list.error && !hasModels ? (
              <ErrorState message={list.error} onRetry={list.refresh} />
            ) : showEmpty ? (
              <EmptyState
                icon={StarIcon}
                title={debouncedSearch ? "没有匹配的模型" : "还没有模型配置"}
                description={
                  debouncedSearch
                    ? "换个关键词，或清空搜索条件后再试。"
                    : "新增模型后，其他模块即可通过别名调用。"
                }
                action={
                  debouncedSearch ? (
                    <Button variant="outline" onClick={() => setSearch("")}>
                      清空搜索
                    </Button>
                  ) : hasPermission("ai_models.create") ? (
                    <Button onClick={handleAdd}>
                      <PlusIcon data-icon="inline-start" />
                      新增模型
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <div className="flex flex-col gap-2 md:hidden">
                  {list.items.map((model) => (
                    <RecordCard
                      key={model.id}
                      title={model.alias}
                      badges={
                        <Badge
                          variant={model.isDefault ? "success" : "secondary"}
                        >
                          {model.isDefault ? "默认" : "普通"}
                        </Badge>
                      }
                      subtitle={model.modelName}
                      meta={
                        <span className="max-w-[240px] truncate">
                          {model.apiUrl}
                        </span>
                      }
                      actions={
                        <RowActions actions={buildModelActions(model)} />
                      }
                    />
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>别名</TableHead>
                        <TableHead className="hidden md:table-cell">
                          模型名称
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          API 地址
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          API Key
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          描述
                        </TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="sticky right-0 bg-card text-right">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.items.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">
                            {model.alias}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {model.modelName}
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                            {model.apiUrl}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
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
                                    ? "隐藏 API Key"
                                    : "显示 API Key"
                                }
                                onClick={() => toggleKeyVisibility(model.id)}
                              >
                                {visibleKeys.has(model.id) ? (
                                  <EyeOffIcon />
                                ) : (
                                  <EyeIcon />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="hidden max-w-[150px] truncate text-muted-foreground xl:table-cell">
                            {model.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                model.isDefault ? "success" : "secondary"
                              }
                            >
                              {model.isDefault ? "默认" : "普通"}
                            </Badge>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-inherit text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasPermission("ai_models") && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleTest(model)}
                                  disabled={testingId === model.id}
                                >
                                  {testingId === model.id ? (
                                    <Spinner />
                                  ) : (
                                    <TestTubeIcon />
                                  )}
                                  <span className="sr-only">
                                    测试 {model.alias}
                                  </span>
                                </Button>
                              )}
                              {hasPermission("ai_models.edit") && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleEdit(model)}
                                >
                                  <PencilIcon />
                                  <span className="sr-only">
                                    编辑 {model.alias}
                                  </span>
                                </Button>
                              )}
                              {hasPermission("ai_models.delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDelete(model)}
                                >
                                  <Trash2Icon />
                                  <span className="sr-only">
                                    删除 {model.alias}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </ListShell>
        </TabsContent>

        <TabsContent value="presets" className="flex flex-col gap-(--page-gap)">
          <AiModelPresetManager />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingModel ? "编辑模型" : "新增模型"}
        description={
          editingModel
            ? "修改 AI 模型的配置信息。"
            : "填写以下信息添加新的 AI 模型配置，或从预设模型中快速选择。"
        }
        submitting={editSubmitting}
        className="sm:max-w-lg"
        onSubmit={handleEditSubmit}
      >
        <FieldGroup>
          {!editingModel && groupedPresets.length > 0 && (
            <Field>
              <FieldLabel>快速选择预设模型</FieldLabel>
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
                <SelectTrigger className="w-full" aria-label="快速选择预设模型">
                  <SelectValue placeholder="选择常用 AI 模型…" />
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
                选择后将自动填充模型名称和 API 地址，只需填写 API Key。
              </FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="model-alias">别名</FieldLabel>
            <Input
              id="model-alias"
              placeholder="例如：deepseek-chat"
              value={editForm.alias}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  alias: event.target.value,
                }))
              }
              required
              pattern="^[a-zA-Z0-9_-]+$"
              title="别名只能包含字母、数字、下划线和连字符"
            />
            <FieldDescription>
              唯一标识符，其他模块通过此别名调用模型。
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="model-name">模型名称</FieldLabel>
            <Input
              id="model-name"
              placeholder="例如：deepseek-chat"
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
            <FieldLabel htmlFor="model-api-url">API 地址</FieldLabel>
            <Input
              id="model-api-url"
              type="url"
              placeholder="例如：https://api.deepseek.com/v1/chat/completions"
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
            <FieldLabel htmlFor="model-api-key">API Key</FieldLabel>
            <PasswordInput
              id="model-api-key"
              placeholder={editingModel ? "留空保持不变" : "请输入 API Key"}
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
            <FieldLabel htmlFor="model-description">描述</FieldLabel>
            <Textarea
              id="model-description"
              placeholder="请输入模型描述（可选）"
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
              <FieldLabel htmlFor="model-default">设为默认模型</FieldLabel>
              <FieldDescription>
                默认模型可被其他模块直接调用，无需指定别名。
              </FieldDescription>
            </div>
            <Switch
              id="model-default"
              aria-label="设为默认模型"
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
              测试结果
            </DialogTitle>
            <DialogDescription>
              {testResult?.success
                ? "模型配置测试成功。"
                : "模型配置测试失败。"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              {testResult?.message}
            </div>
            {testResult?.responseTime != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">响应时间</span>
                <span className="font-medium">
                  {testResult.responseTime} ms
                </span>
              </div>
            )}
            {testResult?.model && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">实际模型</span>
                <span className="font-medium">{testResult.model}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTestResult(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

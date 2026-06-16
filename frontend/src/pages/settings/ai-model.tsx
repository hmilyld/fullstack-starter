import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/shared/loading-button"
import { TableEmptyRow, TableCardSkeleton } from "@/components/shared/table-states"
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog"
import { Pagination } from "@/components/shared/pagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, EyeIcon, EyeOffIcon, StarIcon, TestTubeIcon, CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { AiModel, AiModelPreset } from "@/types/api"
import {
  getAiModels,
  createAiModel,
  updateAiModel,
  deleteAiModel as apiDeleteAiModel,
  testAiModel,
  getActiveAiModelPresets,
  getAiModelPresets,
  getAiModelPresetGroups,
  createAiModelPreset,
  updateAiModelPreset,
  deleteAiModel as apiDeleteAiModelPreset,
} from "@/lib/api"
import { appToast } from "@/lib/toast"

const PAGE_SIZE = 10

// 预设模型列表（用于新增模型时的快捷选择，数据来自后端）

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}

// 预设模型管理组件
function AiModelPresetManager() {
  const { hasPermission } = useAuth()
  const [presets, setPresets] = React.useState<AiModelPreset[]>([])
  const [groups, setGroups] = React.useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingPreset, setEditingPreset] = React.useState<AiModelPreset | null>(null)
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
  const [deleteTarget, setDeleteTarget] = React.useState<AiModelPreset | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    const [presetsRes, groupsRes] = await Promise.all([
      getAiModelPresets({ search, group: selectedGroup }),
      getAiModelPresetGroups(),
    ])
    if (presetsRes.code === 0) setPresets(presetsRes.data)
    if (groupsRes.code === 0) setGroups(groupsRes.data)
    setLoading(false)
  }, [search, selectedGroup])

  React.useEffect(() => {
    loadData()
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

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    if (editingPreset) {
      const res = await updateAiModelPreset(editingPreset.id, editForm)
      if (res.code !== 0) {
        appToast.error(res.message)
        setEditSubmitting(false)
        return
      }
    } else {
      const res = await createAiModelPreset(editForm)
      if (res.code !== 0) {
        appToast.error(res.message)
        setEditSubmitting(false)
        return
      }
    }
    setEditSubmitting(false)
    setEditOpen(false)
    loadData()
  }

  function handleDelete(preset: AiModelPreset) {
    setDeleteTarget(preset)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true)
    if (deleteTarget) {
      await apiDeleteAiModelPreset(deleteTarget.id)
    }
    setDeleteSubmitting(false)
    setDeleteOpen(false)
    loadData()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>预设模型列表</CardTitle>
            <CardDescription>共 {presets.length} 个预设模型</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedGroup || "__all__"} onValueChange={(v) => setSelectedGroup(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="全部分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部分组</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索别名或模型名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {hasPermission("ai_models.presets.create") && (
              <Button onClick={handleAdd} className="w-full sm:w-auto">
                <PlusIcon data-icon="inline-start" />
                新增预设
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableCardSkeleton colSpan={8} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分组</TableHead>
                <TableHead>别名</TableHead>
                <TableHead>模型名称</TableHead>
                <TableHead>API 地址</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>排序</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presets.map((preset) => (
                <TableRow key={preset.id}>
                  <TableCell>
                    <Badge variant="outline">{preset.group}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{preset.alias}</TableCell>
                  <TableCell>{preset.modelName}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {preset.apiUrl}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">
                    {preset.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={preset.isActive ? "default" : "secondary"}>
                      {preset.isActive ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{preset.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission("ai_models.presets.edit") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(preset)}>
                          <PencilIcon data-icon="inline-start" />
                          <span className="sr-only">编辑</span>
                        </Button>
                      )}
                      {hasPermission("ai_models.presets.delete") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(preset)}>
                          <Trash2Icon data-icon="inline-start" />
                          <span className="sr-only">删除</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {presets.length === 0 && <TableEmptyRow colSpan={8} />}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* 新增/编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "编辑预设模型" : "新增预设模型"}</DialogTitle>
            <DialogDescription>
              {editingPreset
                ? "修改预设模型的配置信息。"
                : "填写以下信息添加新的预设模型。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="preset-group">分组 *</FieldLabel>
                <Input
                  id="preset-group"
                  placeholder="例如: DeepSeek, OpenAI"
                  value={editForm.group}
                  onChange={(e) => setEditForm((f) => ({ ...f, group: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  用于分类管理，相同分组的模型会显示在一起
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="preset-alias">别名 *</FieldLabel>
                <Input
                  id="preset-alias"
                  placeholder="例如: deepseek-chat, gpt-4o"
                  value={editForm.alias}
                  onChange={(e) => setEditForm((f) => ({ ...f, alias: e.target.value }))}
                  required
                  pattern="^[a-zA-Z0-9._-]+$"
                  title="别名只能包含字母、数字、点、下划线和连字符"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="preset-modelName">模型名称 *</FieldLabel>
                <Input
                  id="preset-modelName"
                  placeholder="例如: deepseek-chat, gpt-4o"
                  value={editForm.modelName}
                  onChange={(e) => setEditForm((f) => ({ ...f, modelName: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="preset-apiUrl">API 地址 *</FieldLabel>
                <Input
                  id="preset-apiUrl"
                  placeholder="例如: https://api.deepseek.com/v1/chat/completions"
                  value={editForm.apiUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, apiUrl: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="preset-description">描述</FieldLabel>
                <Textarea
                  id="preset-description"
                  placeholder="请输入模型描述（可选）"
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="preset-sortOrder">排序</FieldLabel>
                  <Input
                    id="preset-sortOrder"
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                  />
                </Field>
                <Field>
                  <div className="flex items-center justify-between pt-6">
                    <FieldLabel htmlFor="preset-isActive">启用</FieldLabel>
                    <Switch
                      id="preset-isActive"
                      checked={editForm.isActive}
                      onCheckedChange={(checked) =>
                        setEditForm((f) => ({ ...f, isActive: checked }))
                      }
                    />
                  </div>
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <LoadingButton type="submit" loading={editSubmitting}>
                {editingPreset ? "保存" : "创建"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.alias ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />
    </Card>
  )
}

// 预设模型列表类型（用于新增模型时的快捷选择）
type PresetForSelect = {
  alias: string
  modelName: string
  apiUrl: string
  description: string
  group: string
}

export function AiModelPage() {
  const { hasPermission } = useAuth()
  const [models, setModels] = React.useState<AiModel[]>([])
  const [presets, setPresets] = React.useState<PresetForSelect[]>([])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [tableLoading, setTableLoading] = React.useState(true)
  const [editSubmitting, setEditSubmitting] = React.useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  // 显示/隐藏 API Key
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set())

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    const [modelsRes, presetsRes] = await Promise.all([
      getAiModels({ search, page, pageSize: PAGE_SIZE }),
      getActiveAiModelPresets(),
    ])
    if (modelsRes.code === 0) {
      setModels(modelsRes.data.list)
      setTotal(modelsRes.data.total)
    }
    if (presetsRes.code === 0) {
      setPresets(presetsRes.data)
    }
    setTableLoading(false)
  }, [search, page])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 新增/编辑对话框
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

  // 删除确认对话框
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<AiModel | null>(null)

  // 测试状态
  const [testingId, setTestingId] = React.useState<string | null>(null)
  const [testResult, setTestResult] = React.useState<{
    success: boolean
    message: string
    responseTime: number | null
    model: string | null
  } | null>(null)

  // 分页
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  React.useEffect(() => {
    setPage(1)
  }, [search])

  // 打开新增
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

  // 打开编辑
  function handleEdit(model: AiModel) {
    setEditingModel(model)
    setEditForm({
      alias: model.alias,
      modelName: model.modelName,
      apiUrl: model.apiUrl,
      apiKey: model.apiKey,
      description: model.description,
      isDefault: model.isDefault,
    })
    setEditOpen(true)
  }

  // 提交新增/编辑
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    if (editingModel) {
      const res = await updateAiModel(editingModel.id, {
        alias: editForm.alias,
        modelName: editForm.modelName,
        apiUrl: editForm.apiUrl,
        apiKey: editForm.apiKey,
        description: editForm.description,
        isDefault: editForm.isDefault,
      })
      if (res.code !== 0) {
        appToast.error(res.message)
        setEditSubmitting(false)
        return
      }
    } else {
      const res = await createAiModel({
        alias: editForm.alias,
        modelName: editForm.modelName,
        apiUrl: editForm.apiUrl,
        apiKey: editForm.apiKey,
        description: editForm.description,
        isDefault: editForm.isDefault,
      })
      if (res.code !== 0) {
        appToast.error(res.message)
        setEditSubmitting(false)
        return
      }
    }
    setEditSubmitting(false)
    setEditOpen(false)
    loadData()
  }

  // 打开删除确认
  function handleDelete(model: AiModel) {
    setDeleteTarget(model)
    setDeleteOpen(true)
  }

  // 确认删除
  async function handleDeleteConfirm() {
    setDeleteSubmitting(true)
    if (deleteTarget) {
      await apiDeleteAiModel(deleteTarget.id)
    }
    setDeleteSubmitting(false)
    setDeleteOpen(false)
    loadData()
  }

  // 测试模型
  async function handleTest(model: AiModel) {
    setTestingId(model.id)
    setTestResult(null)
    try {
      const res = await testAiModel({
        apiUrl: model.apiUrl,
        apiKey: model.apiKey,
        modelName: model.modelName,
      })
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
    } catch {
      setTestResult({
        success: false,
        message: "网络请求失败",
        responseTime: null,
        model: null,
      })
    }
    setTestingId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI模型配置</h1>
        <p className="text-muted-foreground">管理系统使用的AI模型配置，支持多个模型和自定义别名。</p>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList>
          <TabsTrigger value="models">模型配置</TabsTrigger>
          <TabsTrigger value="presets">预设模型管理</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="flex flex-col gap-6">
          {tableLoading ? (
            <TableCardSkeleton colSpan={7} />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>模型列表</CardTitle>
                    <CardDescription>共 {total} 个模型配置</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="搜索别名或模型名称..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {hasPermission("ai_models.create") && (
                      <Button onClick={handleAdd} className="w-full sm:w-auto">
                        <PlusIcon data-icon="inline-start" />
                        新增模型
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>别名</TableHead>
                    <TableHead>模型名称</TableHead>
                    <TableHead>API 地址</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.alias}</span>
                          {model.isDefault && (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              <StarIcon data-icon="inline-start" className="size-3" />
                              默认
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{model.modelName}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {model.apiUrl}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs">
                            {visibleKeys.has(model.id) ? model.apiKey : maskApiKey(model.apiKey)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleKeyVisibility(model.id)}
                          >
                            {visibleKeys.has(model.id) ? (
                              <EyeOffIcon className="size-3" />
                            ) : (
                              <EyeIcon className="size-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {model.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.isDefault ? "default" : "secondary"}>
                          {model.isDefault ? "默认" : "普通"}
                        </Badge>
                      </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission("ai_models") && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleTest(model)}
                          disabled={testingId === model.id}
                        >
                          {testingId === model.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <TestTubeIcon data-icon="inline-start" />
                          )}
                          <span className="sr-only">测试</span>
                        </Button>
                      )}
                      {hasPermission("ai_models.edit") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(model)}>
                          <PencilIcon data-icon="inline-start" />
                          <span className="sr-only">编辑</span>
                        </Button>
                      )}
                      {hasPermission("ai_models.delete") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(model)}>
                          <Trash2Icon data-icon="inline-start" />
                          <span className="sr-only">删除</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!tableLoading && models.length === 0 && <TableEmptyRow colSpan={7} />}
            </TableBody>
          </Table>

          {/* 分页 */}
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? "编辑模型" : "新增模型"}</DialogTitle>
            <DialogDescription>
              {editingModel
                ? "修改AI模型的配置信息。"
                : "填写以下信息添加新的AI模型配置，或从预设模型中快速选择。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              {/* 预设模型选择（仅新增时显示） */}
              {!editingModel && presets.length > 0 && (
                <Field>
                  <FieldLabel>快速选择预设模型</FieldLabel>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const preset = presets.find((p) => p.alias === value)
                      if (preset) {
                        setEditForm({
                          alias: preset.alias,
                          modelName: preset.modelName,
                          apiUrl: preset.apiUrl,
                          apiKey: "",
                          description: preset.description,
                          isDefault: false,
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择常用 AI 模型..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(
                        presets.reduce(
                          (acc, preset) => {
                            if (!acc[preset.group]) acc[preset.group] = []
                            acc[preset.group].push(preset)
                            return acc
                          },
                          {} as Record<string, PresetForSelect[]>
                        )
                      ).map(([group, groupPresets]) => (
                        <SelectGroup key={group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group}
                          </div>
                          {groupPresets.map((preset) => (
                            <SelectItem key={preset.alias} value={preset.alias}>
                              {preset.description ? `${preset.alias} - ${preset.description}` : preset.alias}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    选择后将自动填充模型名称和 API 地址，只需填写 API Key
                  </p>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="alias">别名 *</FieldLabel>
                <Input
                  id="alias"
                  placeholder="例如: deepseek-chat, gpt-4o"
                  value={editForm.alias}
                  onChange={(e) => setEditForm((f) => ({ ...f, alias: e.target.value }))}
                  required
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="别名只能包含字母、数字、下划线和连字符"
                />
                <p className="text-xs text-muted-foreground">
                  唯一标识符，其他模块通过此别名调用模型
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="modelName">模型名称 *</FieldLabel>
                <Input
                  id="modelName"
                  placeholder="例如: deepseek-chat, gpt-4o"
                  value={editForm.modelName}
                  onChange={(e) => setEditForm((f) => ({ ...f, modelName: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="apiUrl">API 地址 *</FieldLabel>
                <Input
                  id="apiUrl"
                  placeholder="例如: https://api.deepseek.com/v1/chat/completions"
                  value={editForm.apiUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, apiUrl: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="apiKey">API Key *</FieldLabel>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="请输入 API Key"
                  value={editForm.apiKey}
                  onChange={(e) => setEditForm((f) => ({ ...f, apiKey: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">描述</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="请输入模型描述（可选）"
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="isDefault">设为默认模型</FieldLabel>
                  <Switch
                    id="isDefault"
                    checked={editForm.isDefault}
                    onCheckedChange={(checked) =>
                      setEditForm((f) => ({ ...f, isDefault: checked }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  默认模型可被其他模块直接调用，无需指定别名
                </p>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <LoadingButton type="submit" loading={editSubmitting}>
                {editingModel ? "保存" : "创建"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        targetName={deleteTarget?.alias ?? ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
      />

      {/* 测试结果对话框 */}
      <Dialog open={testResult !== null} onOpenChange={() => setTestResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {testResult?.success ? (
                <CheckCircleIcon className="size-5 text-green-500" />
              ) : (
                <XCircleIcon className="size-5 text-red-500" />
              )}
              测试结果
            </DialogTitle>
            <DialogDescription>
              {testResult?.success ? "模型配置测试成功" : "模型配置测试失败"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">{testResult?.message}</p>
            </div>
            {testResult?.responseTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">响应时间:</span>
                <span className="font-medium">{testResult.responseTime}ms</span>
              </div>
            )}
            {testResult?.model && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">实际模型:</span>
                <span className="font-medium">{testResult.model}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTestResult(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="presets" className="flex flex-col gap-6">
          <AiModelPresetManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
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
} from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import PasswordInput from "@/components/shared/PasswordInput.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import PresetManager from "@/pages/settings/AiModel/PresetManager.vue"
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
  deleteAiModel as apiDeleteAiModel,
  getActiveAiModelPresets,
  getAiModels,
  testAiModel,
  updateAiModel,
} from "@/api/ai-model"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
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

const auth = useAuthStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const activeTab = computed(() =>
  route.query.tab === "presets" ? "presets" : "models"
)

function setActiveTab(value: string) {
  const next = { ...route.query }
  if (value === "models") delete next.tab
  else next.tab = value
  void router.replace({ query: next })
}

const { search, page, setSearch, setPage } = useUrlListState()
const debouncedSearch = useDebouncedValue(search)

const {
  items: models,
  total,
  page: currentPage,
  totalPages,
  loading: listLoading,
  error: listError,
  setPage: setListPage,
  refresh: refreshList,
} = usePagedList<AiModel, { search: string }>({
  fetcher: getAiModels,
  params: computed(() => ({ search: debouncedSearch.value })),
  pageSize: PAGE_SIZE,
  page,
  onPageChange: setPage,
})

const presets = ref<AiModelPreset[]>([])
const groupedPresets = computed(() => groupPresets(presets.value))

onMounted(async () => {
  const res = await getActiveAiModelPresets()
  if (res.code === 0) presets.value = res.data
})

const editOpen = ref(false)
const editingModel = ref<AiModel | null>(null)
const editForm = ref({
  alias: "",
  modelName: "",
  apiUrl: "",
  apiKey: "",
  description: "",
  isDefault: false,
})
const editSubmitting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<AiModel | null>(null)
const deleteSubmitting = ref(false)

const visibleKeys = ref<Set<string>>(new Set())
const testingId = ref<string | null>(null)
const testResult = ref<AiModelTestResult | null>(null)

function handleTestDialogChange(open: boolean) {
  if (!open) testResult.value = null
}

function toggleKeyVisibility(id: string) {
  const next = new Set(visibleKeys.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  visibleKeys.value = next
}

function handleAdd() {
  editingModel.value = null
  editForm.value = {
    alias: "",
    modelName: "",
    apiUrl: "",
    apiKey: "",
    description: "",
    isDefault: false,
  }
  editOpen.value = true
}

function handleEdit(model: AiModel) {
  editingModel.value = model
  editForm.value = {
    alias: model.alias,
    modelName: model.modelName,
    apiUrl: model.apiUrl,
    apiKey: "",
    description: model.description,
    isDefault: model.isDefault,
  }
  editOpen.value = true
}

function applyPreset(alias: string) {
  const preset = presets.value.find((item) => item.alias === alias)
  if (!preset) return
  editForm.value = {
    alias: preset.alias,
    modelName: preset.modelName,
    apiUrl: preset.apiUrl,
    apiKey: "",
    description: preset.description,
    isDefault: false,
  }
}

async function handleEditSubmit() {
  editSubmitting.value = true

  if (editingModel.value) {
    const payload: Partial<Omit<AiModel, "id">> = {
      alias: editForm.value.alias,
      modelName: editForm.value.modelName,
      apiUrl: editForm.value.apiUrl,
      description: editForm.value.description,
      isDefault: editForm.value.isDefault,
    }
    if (editForm.value.apiKey.trim()) payload.apiKey = editForm.value.apiKey

    const res = await updateAiModel(editingModel.value.id, payload)
    editSubmitting.value = false
    if (res.code !== 0) {
      toast.error(res.message || "保存失败")
      return
    }
    toast.success("保存成功")
  } else {
    const res = await createAiModel({
      alias: editForm.value.alias,
      modelName: editForm.value.modelName,
      apiUrl: editForm.value.apiUrl,
      apiKey: editForm.value.apiKey,
      description: editForm.value.description,
      isDefault: editForm.value.isDefault,
    })
    editSubmitting.value = false
    if (res.code !== 0) {
      toast.error(res.message || "创建失败")
      return
    }
    toast.success("创建成功")
  }

  editOpen.value = false
  refreshList()
}

function handleDelete(model: AiModel) {
  deleteTarget.value = model
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  const res = await apiDeleteAiModel(deleteTarget.value.id)
  deleteSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "删除失败")
    return
  }
  toast.success("删除成功")
  deleteOpen.value = false
  refreshList()
}

async function handleTest(model: AiModel) {
  testingId.value = model.id
  testResult.value = null
  const res = await testAiModel({ modelId: model.id })
  if (res.code === 0) {
    testResult.value = res.data
  } else {
    testResult.value = {
      success: false,
      message: res.message || "测试失败",
      responseTime: null,
      model: null,
    }
  }
  testingId.value = null
}

function buildModelActions(model: AiModel): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("ai_models")) {
    actions.push({
      label: testingId.value === model.id ? "测试中…" : "测试",
      icon: TestTube,
      disabled: testingId.value === model.id,
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

const hasModels = computed(() => models.value.length > 0)
const showEmpty = computed(() => !listLoading.value && !hasModels.value)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      title="AI 模型配置"
      description="管理系统使用的 AI 模型配置，支持多个模型和自定义别名。"
    />

    <Tabs
      :model-value="activeTab"
      class="w-full"
      @update:model-value="setActiveTab(String($event))"
    >
      <TabsList>
        <TabsTrigger value="models">模型配置</TabsTrigger>
        <TabsTrigger value="presets">预设模型管理</TabsTrigger>
      </TabsList>

      <TabsContent value="models" class="flex flex-col gap-(--page-gap)">
        <ListShell title="模型列表" :description="`共 ${total} 个模型配置`">
          <template #actions>
            <InputGroup class="w-full md:w-64">
              <InputGroupInput
                name="q"
                autocomplete="off"
                :spellcheck="false"
                placeholder="搜索别名或模型名称…"
                aria-label="搜索模型"
                :model-value="search"
                @update:model-value="setSearch(String($event))"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <Button
              v-if="auth.hasPermission('ai_models.create')"
              class="w-full md:w-auto"
              @click="handleAdd"
            >
              <Plus data-icon="inline-start" />
              新增模型
            </Button>
          </template>

          <template v-if="hasModels" #footer>
            <TablePagination
              :page="currentPage"
              :total-pages="totalPages"
              :total="total"
              item-label="个模型"
              @page-change="setListPage"
            />
          </template>

          <InlineError
            v-if="listError && hasModels"
            :message="listError"
            :on-retry="refreshList"
          />

          <TableSkeletonRow v-if="listLoading && !hasModels" :col-span="7" />
          <ErrorState
            v-else-if="listError && !hasModels"
            :message="listError"
            :on-retry="refreshList"
          />
          <EmptyState
            v-else-if="showEmpty"
            :icon="Star"
            :title="debouncedSearch ? '没有匹配的模型' : '还没有模型配置'"
            :description="
              debouncedSearch
                ? '换个关键词，或清空搜索条件后再试。'
                : '新增模型后，其他模块即可通过别名调用。'
            "
          >
            <template
              v-if="debouncedSearch || auth.hasPermission('ai_models.create')"
              #action
            >
              <Button
                v-if="debouncedSearch"
                variant="outline"
                @click="setSearch('')"
              >
                清空搜索
              </Button>
              <Button
                v-else-if="auth.hasPermission('ai_models.create')"
                @click="handleAdd"
              >
                <Plus data-icon="inline-start" />
                新增模型
              </Button>
            </template>
          </EmptyState>

          <template v-else>
            <div class="flex flex-col gap-2 md:hidden">
              <RecordCard
                v-for="model in models"
                :key="model.id"
                :title="model.alias"
                :subtitle="model.modelName"
              >
                <template #badges>
                  <Badge :variant="model.isDefault ? 'success' : 'secondary'">
                    {{ model.isDefault ? "默认" : "普通" }}
                  </Badge>
                </template>
                <template #meta>
                  <span class="max-w-[240px] truncate">{{ model.apiUrl }}</span>
                </template>
                <template #actions>
                  <RowActions :actions="buildModelActions(model)" />
                </template>
              </RecordCard>
            </div>

            <div class="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>别名</TableHead>
                    <TableHead class="hidden md:table-cell">模型名称</TableHead>
                    <TableHead class="hidden lg:table-cell">API 地址</TableHead>
                    <TableHead class="hidden xl:table-cell">API Key</TableHead>
                    <TableHead class="hidden xl:table-cell">描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead class="sticky right-0 bg-card text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="model in models" :key="model.id">
                    <TableCell class="font-medium">{{ model.alias }}</TableCell>
                    <TableCell class="hidden md:table-cell">
                      {{ model.modelName }}
                    </TableCell>
                    <TableCell
                      class="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell"
                    >
                      {{ model.apiUrl }}
                    </TableCell>
                    <TableCell class="hidden xl:table-cell">
                      <div class="flex items-center gap-2">
                        <code class="text-xs">
                          {{
                            visibleKeys.has(model.id)
                              ? model.apiKey
                              : maskApiKey(model.apiKey)
                          }}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          :aria-label="
                            visibleKeys.has(model.id)
                              ? '隐藏 API Key'
                              : '显示 API Key'
                          "
                          @click="toggleKeyVisibility(model.id)"
                        >
                          <EyeOff v-if="visibleKeys.has(model.id)" />
                          <Eye v-else />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell
                      class="hidden max-w-[150px] truncate text-muted-foreground xl:table-cell"
                    >
                      {{ model.description || "-" }}
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="model.isDefault ? 'success' : 'secondary'"
                      >
                        {{ model.isDefault ? "默认" : "普通" }}
                      </Badge>
                    </TableCell>
                    <TableCell class="sticky right-0 bg-inherit text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button
                          v-if="auth.hasPermission('ai_models')"
                          variant="ghost"
                          size="icon-sm"
                          :disabled="testingId === model.id"
                          @click="handleTest(model)"
                        >
                          <Spinner v-if="testingId === model.id" />
                          <TestTube v-else />
                          <span class="sr-only">测试 {{ model.alias }}</span>
                        </Button>
                        <Button
                          v-if="auth.hasPermission('ai_models.edit')"
                          variant="ghost"
                          size="icon-sm"
                          @click="handleEdit(model)"
                        >
                          <Pencil />
                          <span class="sr-only">编辑 {{ model.alias }}</span>
                        </Button>
                        <Button
                          v-if="auth.hasPermission('ai_models.delete')"
                          variant="ghost"
                          size="icon-sm"
                          @click="handleDelete(model)"
                        >
                          <Trash2 />
                          <span class="sr-only">删除 {{ model.alias }}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </template>
        </ListShell>
      </TabsContent>

      <TabsContent value="presets" class="flex flex-col gap-(--page-gap)">
        <PresetManager />
      </TabsContent>
    </Tabs>

    <FormDialog
      :open="editOpen"
      :title="editingModel ? '编辑模型' : '新增模型'"
      :description="
        editingModel
          ? '修改 AI 模型的配置信息。'
          : '填写以下信息添加新的 AI 模型配置，或从预设模型中快速选择。'
      "
      :submitting="editSubmitting"
      class="sm:max-w-lg"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field v-if="!editingModel && groupedPresets.length > 0">
          <FieldLabel>快速选择预设模型</FieldLabel>
          <Select
            model-value=""
            @update:model-value="applyPreset(String($event))"
          >
            <SelectTrigger class="w-full" aria-label="快速选择预设模型">
              <SelectValue placeholder="选择常用 AI 模型…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup
                v-for="[group, items] in groupedPresets"
                :key="group"
              >
                <SelectLabel>{{ group }}</SelectLabel>
                <SelectItem
                  v-for="preset in items"
                  :key="preset.alias"
                  :value="preset.alias"
                >
                  {{
                    preset.description
                      ? `${preset.alias} - ${preset.description}`
                      : preset.alias
                  }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            选择后将自动填充模型名称和 API 地址，只需填写 API Key。
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="model-alias">别名</FieldLabel>
          <Input
            id="model-alias"
            v-model="editForm.alias"
            name="model-alias"
            autocomplete="off"
            :spellcheck="false"
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
            v-model="editForm.modelName"
            name="model-name"
            autocomplete="off"
            :spellcheck="false"
            placeholder="例如：deepseek-chat"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="model-api-url">API 地址</FieldLabel>
          <Input
            id="model-api-url"
            v-model="editForm.apiUrl"
            name="model-api-url"
            autocomplete="off"
            :spellcheck="false"
            type="url"
            placeholder="例如：https://api.deepseek.com/v1/chat/completions"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="model-api-key">API Key</FieldLabel>
          <PasswordInput
            id="model-api-key"
            v-model="editForm.apiKey"
            placeholder="留空保持不变"
            autocomplete="off"
            :required="!editingModel"
          />
        </Field>
        <Field>
          <FieldLabel for="model-description">描述</FieldLabel>
          <Textarea
            id="model-description"
            v-model="editForm.description"
            name="model-description"
            autocomplete="off"
            placeholder="请输入模型描述（可选）"
            :rows="3"
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
            v-model="editForm.isDefault"
            aria-label="设为默认模型"
          />
        </Field>
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.alias ?? ''"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />

    <Dialog :open="testResult !== null" @update:open="handleTestDialogChange">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <CheckCircle2 v-if="testResult?.success" class="text-success" />
            <XCircle v-else class="text-destructive" />
            测试结果
          </DialogTitle>
          <DialogDescription>
            {{
              testResult?.success ? "模型配置测试成功。" : "模型配置测试失败。"
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="rounded-lg bg-muted p-4 text-sm">
            {{ testResult?.message }}
          </div>
          <div
            v-if="testResult?.responseTime != null"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">响应时间</span>
            <span class="font-medium">{{ testResult.responseTime }} ms</span>
          </div>
          <div
            v-if="testResult?.model"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">实际模型</span>
            <span class="font-medium">{{ testResult.model }}</span>
          </div>
        </div>
        <DialogFooter>
          <Button @click="testResult = null">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

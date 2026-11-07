<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Pencil, Plus, Search, Star, Trash2 } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
  createAiModelPreset,
  deleteAiModelPreset as apiDeleteAiModelPreset,
  getAiModelPresetGroups,
  getAiModelPresets,
  updateAiModelPreset,
} from "@/api/ai-model"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { AiModelPreset } from "@/types/ai-model"

const auth = useAuthStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const selectedGroup = computed(() =>
  typeof route.query.presetGroup === "string" ? route.query.presetGroup : ""
)
const search = computed(() =>
  typeof route.query.presetQ === "string" ? route.query.presetQ : ""
)
const debouncedSearch = useDebouncedValue(search)

function updatePresetParam(key: "presetQ" | "presetGroup", value: string) {
  const next = { ...route.query }
  if (value) next[key] = value
  else delete next[key]
  void router.replace({ query: next })
}

const setSearch = (value: string) => updatePresetParam("presetQ", value)
const setSelectedGroup = (value: string) =>
  updatePresetParam("presetGroup", value)

const presets = ref<AiModelPreset[]>([])
const groups = ref<string[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const editOpen = ref(false)
const editingPreset = ref<AiModelPreset | null>(null)
const editForm = ref({
  group: "",
  alias: "",
  modelName: "",
  apiUrl: "",
  description: "",
  isActive: true,
  sortOrder: 0,
})
const editSubmitting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<AiModelPreset | null>(null)
const deleteSubmitting = ref(false)

let requestId = 0

async function loadData() {
  const id = ++requestId
  loading.value = true
  error.value = null
  const [presetsRes, groupsRes] = await Promise.all([
    getAiModelPresets({
      search: debouncedSearch.value,
      group: selectedGroup.value,
    }),
    getAiModelPresetGroups(),
  ])
  if (id !== requestId) return
  if (presetsRes.code === 0) presets.value = presetsRes.data
  else error.value = presetsRes.message || "加载预设模型失败"
  if (groupsRes.code === 0) groups.value = groupsRes.data
  loading.value = false
}

onMounted(() => {
  void loadData()
})

watch([debouncedSearch, selectedGroup], () => {
  void loadData()
})

function handleAdd() {
  editingPreset.value = null
  editForm.value = {
    group: groups.value[0] || "",
    alias: "",
    modelName: "",
    apiUrl: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  }
  editOpen.value = true
}

function handleEdit(preset: AiModelPreset) {
  editingPreset.value = preset
  editForm.value = {
    group: preset.group,
    alias: preset.alias,
    modelName: preset.modelName,
    apiUrl: preset.apiUrl,
    description: preset.description,
    isActive: preset.isActive,
    sortOrder: preset.sortOrder,
  }
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  const res = editingPreset.value
    ? await updateAiModelPreset(editingPreset.value.id, editForm.value)
    : await createAiModelPreset(editForm.value)
  editSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "操作失败")
    return
  }
  toast.success(editingPreset.value ? "保存成功" : "创建成功")
  editOpen.value = false
  await loadData()
}

function handleDelete(preset: AiModelPreset) {
  deleteTarget.value = preset
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  const res = await apiDeleteAiModelPreset(deleteTarget.value.id)
  deleteSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "删除失败")
    return
  }
  toast.success("删除成功")
  deleteOpen.value = false
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
  const next = { ...route.query }
  delete next.presetQ
  delete next.presetGroup
  void router.replace({ query: next })
}

const hasPresets = computed(() => presets.value.length > 0)
const showEmpty = computed(() => !loading.value && !hasPresets.value)
</script>

<template>
  <ListShell
    title="预设模型列表"
    :description="`共 ${presets.length} 个预设模型`"
  >
    <template #actions>
      <Select
        :model-value="selectedGroup || 'all'"
        @update:model-value="
          setSelectedGroup(String($event) === 'all' ? '' : String($event))
        "
      >
        <SelectTrigger class="w-full md:w-40" aria-label="按分组筛选">
          <SelectValue placeholder="全部分组" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">全部分组</SelectItem>
            <SelectItem v-for="group in groups" :key="group" :value="group">
              {{ group }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <InputGroup class="w-full md:w-60">
        <InputGroupInput
          name="q"
          autocomplete="off"
          :spellcheck="false"
          placeholder="搜索别名或模型名称…"
          aria-label="搜索预设模型"
          :model-value="search"
          @update:model-value="setSearch(String($event))"
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <Button
        v-if="auth.hasPermission('ai_models.presets.create')"
        class="w-full md:w-auto"
        @click="handleAdd"
      >
        <Plus data-icon="inline-start" />
        新增预设
      </Button>
    </template>

    <InlineError
      v-if="error && hasPresets"
      :message="error"
      :on-retry="loadData"
    />

    <TableSkeletonRow v-if="loading" :col-span="8" />
    <ErrorState
      v-else-if="error && !hasPresets"
      :message="error"
      :on-retry="loadData"
    />
    <EmptyState
      v-else-if="showEmpty"
      :icon="Star"
      :title="
        debouncedSearch || selectedGroup ? '没有匹配的预设' : '还没有预设模型'
      "
      :description="
        debouncedSearch || selectedGroup
          ? '换个关键词或分组再试。'
          : '预设在新增模型时用于快速填充模型名称和接口地址。'
      "
    >
      <template #action>
        <Button
          v-if="debouncedSearch || selectedGroup"
          variant="outline"
          @click="clearFilters"
        >
          清除筛选
        </Button>
        <Button
          v-else-if="auth.hasPermission('ai_models.presets.create')"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          新增预设
        </Button>
      </template>
    </EmptyState>

    <template v-else>
      <div class="flex flex-col gap-2 md:hidden">
        <RecordCard
          v-for="preset in presets"
          :key="preset.id"
          :title="preset.alias"
          :subtitle="preset.modelName"
        >
          <template #badges>
            <Badge variant="outline">{{ preset.group }}</Badge>
            <Badge :variant="preset.isActive ? 'success' : 'secondary'">
              {{ preset.isActive ? "启用" : "禁用" }}
            </Badge>
          </template>
          <template #meta>
            <span>排序 {{ preset.sortOrder }}</span>
          </template>
          <template #actions>
            <RowActions :actions="buildPresetActions(preset)" />
          </template>
        </RecordCard>
      </div>

      <div class="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>分组</TableHead>
              <TableHead>别名</TableHead>
              <TableHead class="hidden md:table-cell">模型名称</TableHead>
              <TableHead class="hidden lg:table-cell">API 地址</TableHead>
              <TableHead class="hidden xl:table-cell">描述</TableHead>
              <TableHead>状态</TableHead>
              <TableHead class="hidden lg:table-cell">排序</TableHead>
              <TableHead class="sticky right-0 bg-card text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="preset in presets" :key="preset.id">
              <TableCell>
                <Badge variant="outline">{{ preset.group }}</Badge>
              </TableCell>
              <TableCell class="font-medium">{{ preset.alias }}</TableCell>
              <TableCell class="hidden md:table-cell">
                {{ preset.modelName }}
              </TableCell>
              <TableCell
                class="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell"
              >
                {{ preset.apiUrl }}
              </TableCell>
              <TableCell
                class="hidden max-w-[150px] truncate text-muted-foreground xl:table-cell"
              >
                {{ preset.description || "-" }}
              </TableCell>
              <TableCell>
                <Badge :variant="preset.isActive ? 'success' : 'secondary'">
                  {{ preset.isActive ? "启用" : "禁用" }}
                </Badge>
              </TableCell>
              <TableCell class="hidden lg:table-cell">
                {{ preset.sortOrder }}
              </TableCell>
              <TableCell class="sticky right-0 bg-inherit text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    v-if="auth.hasPermission('ai_models.presets.edit')"
                    variant="ghost"
                    size="icon-sm"
                    @click="handleEdit(preset)"
                  >
                    <Pencil />
                    <span class="sr-only">编辑 {{ preset.alias }}</span>
                  </Button>
                  <Button
                    v-if="auth.hasPermission('ai_models.presets.delete')"
                    variant="ghost"
                    size="icon-sm"
                    @click="handleDelete(preset)"
                  >
                    <Trash2 />
                    <span class="sr-only">删除 {{ preset.alias }}</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </ListShell>

  <FormDialog
    :open="editOpen"
    :title="editingPreset ? '编辑预设模型' : '新增预设模型'"
    :description="
      editingPreset
        ? '修改预设模型的配置信息。'
        : '填写以下信息添加新的预设模型。'
    "
    :submitting="editSubmitting"
    class="sm:max-w-lg"
    @update:open="editOpen = $event"
    @submit="handleEditSubmit"
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="preset-group">分组</FieldLabel>
        <Input
          id="preset-group"
          v-model="editForm.group"
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
          v-model="editForm.alias"
          name="preset-alias"
          autocomplete="off"
          :spellcheck="false"
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
          v-model="editForm.modelName"
          name="preset-model-name"
          autocomplete="off"
          :spellcheck="false"
          placeholder="例如：deepseek-chat"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="preset-api-url">API 地址</FieldLabel>
        <Input
          id="preset-api-url"
          v-model="editForm.apiUrl"
          name="preset-api-url"
          autocomplete="off"
          :spellcheck="false"
          type="url"
          placeholder="例如：https://api.deepseek.com/v1/chat/completions"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="preset-description">描述</FieldLabel>
        <Textarea
          id="preset-description"
          v-model="editForm.description"
          name="preset-description"
          autocomplete="off"
          placeholder="请输入模型描述（可选）"
          :rows="2"
        />
      </Field>
      <div class="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel for="preset-sort-order">排序</FieldLabel>
          <Input
            id="preset-sort-order"
            v-model.number="editForm.sortOrder"
            name="preset-sort-order"
            autocomplete="off"
            type="number"
            :min="0"
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
            v-model="editForm.isActive"
            aria-label="启用预设"
          />
        </Field>
      </div>
    </FieldGroup>
  </FormDialog>

  <ConfirmDeleteDialog
    :open="deleteOpen"
    :target-name="deleteTarget?.alias ?? ''"
    :loading="deleteSubmitting"
    @update:open="deleteOpen = $event"
    @confirm="handleDeleteConfirm"
  />
</template>

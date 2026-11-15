<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
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
import ColumnToggle from "@/components/shared/ColumnToggle.vue"
import DensityToggle from "@/components/shared/DensityToggle.vue"
import DataList, { type DataColumn } from "@/components/shared/DataList.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import ListShell from "@/components/shared/ListShell.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import PasswordInput from "@/components/shared/PasswordInput.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TablePagination from "@/components/shared/TablePagination.vue"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useColumnVisibility } from "@/composables/use-column-visibility"
import { useTableDensity } from "@/composables/use-table-density"
import { usePagedList } from "@/composables/use-paged-list"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
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

const { t } = useI18n()
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

const pageSize = ref(DEFAULT_PAGE_SIZE)
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
  pageSize,
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
      toast.error(res.message || t("aiModelPage.toasts.saveFailed"))
      return
    }
    toast.success(t("aiModelPage.toasts.saveSuccess"))
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
      toast.error(res.message || t("aiModelPage.toasts.createFailed"))
      return
    }
    toast.success(t("aiModelPage.toasts.createSuccess"))
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
    toast.error(res.message || t("aiModelPage.toasts.deleteFailed"))
    return
  }
  toast.success(t("aiModelPage.toasts.deleteSuccess"))
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
      message: res.message || t("aiModelPage.toasts.testFailed"),
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
      label:
        testingId.value === model.id
          ? t("aiModelPage.model.testing")
          : t("aiModelPage.model.test"),
      icon: TestTube,
      disabled: testingId.value === model.id,
      onSelect: () => handleTest(model),
    })
  }
  if (auth.hasPermission("ai_models.edit")) {
    actions.push({
      label: t("common.edit"),
      icon: Pencil,
      onSelect: () => handleEdit(model),
    })
  }
  if (auth.hasPermission("ai_models.delete")) {
    actions.push({
      label: t("common.delete"),
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => handleDelete(model),
    })
  }
  return actions
}

const columns = computed<DataColumn[]>(() => [
  { key: "alias", header: t("aiModelPage.labels.alias") },
  {
    key: "modelName",
    header: t("aiModelPage.labels.modelName"),
    hideable: true,
    headClass: "hidden md:table-cell",
    cellClass: "hidden md:table-cell",
  },
  {
    key: "apiUrl",
    header: t("aiModelPage.labels.apiUrl"),
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass:
      "hidden max-w-[200px] truncate text-muted-foreground lg:table-cell",
  },
  {
    key: "apiKey",
    header: t("aiModelPage.labels.apiKey"),
    hideable: true,
    headClass: "hidden xl:table-cell",
    cellClass: "hidden xl:table-cell",
  },
  {
    key: "description",
    header: t("aiModelPage.labels.description"),
    hideable: true,
    headClass: "hidden xl:table-cell",
    cellClass:
      "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
  },
  { key: "status", header: t("aiModelPage.labels.status") },
  {
    key: "actions",
    header: t("aiModelPage.labels.actions"),
    pinRight: true,
    headClass: "text-right",
    cellClass: "text-right",
  },
])

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "ai-models",
  columns
)
const { density, setDensity } = useTableDensity("ai-models")

const hasModels = computed(() => models.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      :title="t('aiModelPage.title')"
      :description="t('aiModelPage.description')"
    />

    <Tabs
      :model-value="activeTab"
      class="w-full"
      @update:model-value="setActiveTab(String($event))"
    >
      <TabsList>
        <TabsTrigger value="models">{{
          t("aiModelPage.tabs.models")
        }}</TabsTrigger>
        <TabsTrigger value="presets">{{
          t("aiModelPage.tabs.presets")
        }}</TabsTrigger>
      </TabsList>

      <TabsContent value="models" class="flex flex-col gap-(--page-gap)">
        <ListShell
          :description="t('aiModelPage.model.listDescription', { total })"
        >
          <template #actions>
            <InputGroup class="w-full md:w-64">
              <InputGroupInput
                name="q"
                autocomplete="off"
                :spellcheck="false"
                :placeholder="t('aiModelPage.model.searchPlaceholder')"
                :aria-label="t('aiModelPage.model.searchAria')"
                :model-value="search"
                @update:model-value="setSearch(String($event))"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <ColumnToggle
              :columns="columns"
              :hidden="hidden"
              @toggle="toggle"
              @reset="reset"
            />
            <DensityToggle :density="density" @change="setDensity" />
            <Button
              v-if="auth.hasPermission('ai_models.create')"
              class="w-full md:w-auto"
              @click="handleAdd"
            >
              <Plus data-icon="inline-start" />
              {{ t("aiModelPage.model.add") }}
            </Button>
          </template>

          <template v-if="hasModels" #footer>
            <TablePagination
              :page="currentPage"
              :total-pages="totalPages"
              :total="total"
              :item-label="t('aiModelPage.model.entityName')"
              :page-size="pageSize"
              :page-size-options="PAGE_SIZE_OPTIONS"
              @page-change="setListPage"
              @page-size-change="
                (size) => {
                  pageSize = size
                  setListPage(1)
                }
              "
            />
          </template>

          <DataList
            :items="models"
            :loading="listLoading"
            :error="listError"
            :columns="visibleColumns"
            :density="density"
            :skeleton-col-span="7"
            :empty="{
              icon: Star,
              title: debouncedSearch
                ? t('aiModelPage.model.emptySearchTitle')
                : t('aiModelPage.model.emptyTitle'),
              description: debouncedSearch
                ? t('aiModelPage.model.emptySearchDescription')
                : t('aiModelPage.model.emptyDescription'),
            }"
            @retry="refreshList"
            @hide-column="toggle"
          >
            <template #empty-action>
              <Button
                v-if="debouncedSearch"
                variant="outline"
                @click="setSearch('')"
              >
                {{ t("aiModelPage.model.clearSearch") }}
              </Button>
              <Button
                v-else-if="auth.hasPermission('ai_models.create')"
                @click="handleAdd"
              >
                <Plus data-icon="inline-start" />
                {{ t("aiModelPage.model.add") }}
              </Button>
            </template>

            <template #card="{ row }">
              <RecordCard :title="row.alias" :subtitle="row.modelName">
                <template #badges>
                  <Badge :variant="row.isDefault ? 'success' : 'secondary'">
                    {{
                      row.isDefault
                        ? t("aiModelPage.labels.default")
                        : t("aiModelPage.labels.normal")
                    }}
                  </Badge>
                </template>
                <template #meta>
                  <span class="max-w-[240px] truncate">{{ row.apiUrl }}</span>
                </template>
                <template #actions>
                  <RowActions :actions="buildModelActions(row)" />
                </template>
              </RecordCard>
            </template>

            <template #cell-alias="{ row }">
              <span class="font-medium">{{ row.alias }}</span>
            </template>
            <template #cell-modelName="{ row }">{{ row.modelName }}</template>
            <template #cell-apiUrl="{ row }">{{ row.apiUrl }}</template>
            <template #cell-apiKey="{ row }">
              <div class="flex items-center gap-2">
                <code class="text-xs">
                  {{
                    visibleKeys.has(row.id)
                      ? row.apiKey
                      : maskApiKey(row.apiKey)
                  }}
                </code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  :aria-label="
                    visibleKeys.has(row.id)
                      ? t('aiModelPage.model.hideKey')
                      : t('aiModelPage.model.showKey')
                  "
                  @click="toggleKeyVisibility(row.id)"
                >
                  <EyeOff v-if="visibleKeys.has(row.id)" />
                  <Eye v-else />
                </Button>
              </div>
            </template>
            <template #cell-description="{ row }">
              {{ row.description || "-" }}
            </template>
            <template #cell-status="{ row }">
              <Badge :variant="row.isDefault ? 'success' : 'secondary'">
                {{
                  row.isDefault
                    ? t("aiModelPage.labels.default")
                    : t("aiModelPage.labels.normal")
                }}
              </Badge>
            </template>
            <template #cell-actions="{ row }">
              <div class="flex items-center justify-end gap-1">
                <Button
                  v-if="auth.hasPermission('ai_models.edit')"
                  variant="ghost"
                  size="icon-sm"
                  @click="handleEdit(row)"
                >
                  <Pencil />
                  <span class="sr-only">{{
                    t("aiModelPage.model.editSrOnly", { name: row.alias })
                  }}</span>
                </Button>
                <RowActions
                  :actions="
                    buildModelActions(row).filter(
                      (item) => item.label !== t('common.edit')
                    )
                  "
                />
              </div>
            </template>
          </DataList>
        </ListShell>
      </TabsContent>

      <TabsContent value="presets" class="flex flex-col gap-(--page-gap)">
        <PresetManager />
      </TabsContent>
    </Tabs>

    <FormDialog
      :open="editOpen"
      :title="
        editingModel
          ? t('aiModelPage.model.form.editTitle')
          : t('aiModelPage.model.form.addTitle')
      "
      :description="
        editingModel
          ? t('aiModelPage.model.form.editDescription')
          : t('aiModelPage.model.form.addDescription')
      "
      :submitting="editSubmitting"
      class="sm:max-w-lg"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field v-if="!editingModel && groupedPresets.length > 0">
          <FieldLabel>{{ t("aiModelPage.model.form.presetLabel") }}</FieldLabel>
          <Select
            model-value=""
            @update:model-value="applyPreset(String($event))"
          >
            <SelectTrigger
              class="w-full"
              :aria-label="t('aiModelPage.model.form.presetAria')"
            >
              <SelectValue
                :placeholder="t('aiModelPage.model.form.presetPlaceholder')"
              />
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
            {{ t("aiModelPage.model.form.presetHint") }}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="model-alias">{{
            t("aiModelPage.model.form.alias")
          }}</FieldLabel>
          <Input
            id="model-alias"
            v-model="editForm.alias"
            name="model-alias"
            autocomplete="off"
            :spellcheck="false"
            :placeholder="t('aiModelPage.model.form.aliasPlaceholder')"
            required
            pattern="^[a-zA-Z0-9_-]+$"
            :title="t('aiModelPage.model.form.aliasPattern')"
          />
          <FieldDescription>
            {{ t("aiModelPage.model.form.aliasHint") }}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel for="model-name">{{
            t("aiModelPage.model.form.modelName")
          }}</FieldLabel>
          <Input
            id="model-name"
            v-model="editForm.modelName"
            name="model-name"
            autocomplete="off"
            :spellcheck="false"
            :placeholder="t('aiModelPage.model.form.modelNamePlaceholder')"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="model-api-url">{{
            t("aiModelPage.model.form.apiUrl")
          }}</FieldLabel>
          <Input
            id="model-api-url"
            v-model="editForm.apiUrl"
            name="model-api-url"
            autocomplete="off"
            :spellcheck="false"
            type="url"
            :placeholder="t('aiModelPage.model.form.apiUrlPlaceholder')"
            required
          />
        </Field>
        <Field>
          <FieldLabel for="model-api-key">{{
            t("aiModelPage.model.form.apiKey")
          }}</FieldLabel>
          <PasswordInput
            id="model-api-key"
            v-model="editForm.apiKey"
            :placeholder="t('aiModelPage.model.form.apiKeyKeep')"
            autocomplete="off"
            :required="!editingModel"
          />
        </Field>
        <Field>
          <FieldLabel for="model-description">{{
            t("aiModelPage.model.form.description")
          }}</FieldLabel>
          <Textarea
            id="model-description"
            v-model="editForm.description"
            name="model-description"
            autocomplete="off"
            :placeholder="t('aiModelPage.model.form.descriptionPlaceholder')"
            :rows="3"
          />
        </Field>
        <Field orientation="horizontal">
          <div class="flex flex-1 flex-col gap-1">
            <FieldLabel for="model-default">{{
              t("aiModelPage.model.form.defaultLabel")
            }}</FieldLabel>
            <FieldDescription>
              {{ t("aiModelPage.model.form.defaultHint") }}
            </FieldDescription>
          </div>
          <Switch
            id="model-default"
            v-model="editForm.isDefault"
            :aria-label="t('aiModelPage.model.form.defaultLabel')"
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
            {{ t("aiModelPage.test.title") }}
          </DialogTitle>
          <DialogDescription>
            {{
              testResult?.success
                ? t("aiModelPage.test.successDescription")
                : t("aiModelPage.test.failureDescription")
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
            <span class="text-muted-foreground">{{
              t("aiModelPage.test.responseTime")
            }}</span>
            <span class="font-medium">{{ testResult.responseTime }} ms</span>
          </div>
          <div
            v-if="testResult?.model"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">{{
              t("aiModelPage.test.actualModel")
            }}</span>
            <span class="font-medium">{{ testResult.model }}</span>
          </div>
        </div>
        <DialogFooter>
          <Button @click="testResult = null">{{
            t("aiModelPage.test.close")
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

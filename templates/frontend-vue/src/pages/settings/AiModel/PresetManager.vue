<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { Pencil, Plus, Search, Star, Trash2 } from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import ColumnToggle from "@/components/shared/ColumnToggle.vue"
import DensityToggle from "@/components/shared/DensityToggle.vue"
import DataList, { type DataColumn } from "@/components/shared/DataList.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import ListShell from "@/components/shared/ListShell.vue"
import RecordCard from "@/components/shared/RecordCard.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
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
import { Textarea } from "@/components/ui/textarea"
import {
  createAiModelPreset,
  deleteAiModelPreset as apiDeleteAiModelPreset,
  getAiModelPresetGroups,
  getAiModelPresets,
  updateAiModelPreset,
} from "@/api/ai-model"
import { useColumnVisibility } from "@/composables/use-column-visibility"
import { useTableDensity } from "@/composables/use-table-density"
import { useDebouncedValue } from "@/composables/use-debounced-value"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import type { AiModelPreset } from "@/types/ai-model"

const { t } = useI18n()
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
  else error.value = presetsRes.message || t("aiModelPage.toasts.loadFailed")
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
    toast.error(res.message || t("aiModelPage.toasts.operationFailed"))
    return
  }
  toast.success(
    editingPreset.value
      ? t("aiModelPage.toasts.saveSuccess")
      : t("aiModelPage.toasts.createSuccess")
  )
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
    toast.error(res.message || t("aiModelPage.toasts.deleteFailed"))
    return
  }
  toast.success(t("aiModelPage.toasts.deleteSuccess"))
  deleteOpen.value = false
  await loadData()
}

function buildPresetActions(preset: AiModelPreset): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("ai_models.presets.edit")) {
    actions.push({
      label: t("common.edit"),
      icon: Pencil,
      onSelect: () => handleEdit(preset),
    })
  }
  if (auth.hasPermission("ai_models.presets.delete")) {
    actions.push({
      label: t("common.delete"),
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

const columns = computed<DataColumn[]>(() => [
  {
    key: "group",
    header: t("aiModelPage.labels.group"),
    hideable: true,
  },
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
    key: "description",
    header: t("aiModelPage.labels.description"),
    hideable: true,
    headClass: "hidden xl:table-cell",
    cellClass:
      "hidden max-w-[150px] truncate text-muted-foreground xl:table-cell",
  },
  { key: "status", header: t("aiModelPage.labels.status") },
  {
    key: "sort",
    header: t("aiModelPage.labels.sort"),
    hideable: true,
    headClass: "hidden lg:table-cell",
    cellClass: "hidden lg:table-cell",
  },
  {
    key: "actions",
    header: t("aiModelPage.labels.actions"),
    pinRight: true,
    headClass: "text-right",
    cellClass: "text-right",
  },
])

const { hidden, visibleColumns, toggle, reset } = useColumnVisibility(
  "ai-presets",
  columns
)
const { density, setDensity } = useTableDensity("ai-presets")
</script>

<template>
  <ListShell
    :description="
      t('aiModelPage.preset.listDescription', { total: presets.length })
    "
  >
    <template #actions>
      <Select
        :model-value="selectedGroup || 'all'"
        @update:model-value="
          setSelectedGroup(String($event) === 'all' ? '' : String($event))
        "
      >
        <SelectTrigger
          class="w-full md:w-40"
          :aria-label="t('aiModelPage.preset.groupFilterAria')"
        >
          <SelectValue :placeholder="t('aiModelPage.preset.allGroups')" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">{{
              t("aiModelPage.preset.allGroups")
            }}</SelectItem>
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
          :placeholder="t('aiModelPage.preset.searchPlaceholder')"
          :aria-label="t('aiModelPage.preset.searchAria')"
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
        v-if="auth.hasPermission('ai_models.presets.create')"
        class="w-full md:w-auto"
        @click="handleAdd"
      >
        <Plus data-icon="inline-start" />
        {{ t("aiModelPage.preset.add") }}
      </Button>
    </template>

    <DataList
      :items="presets"
      :loading="loading"
      :error="error"
      :columns="visibleColumns"
      :density="density"
      :skeleton-col-span="8"
      :empty="{
        icon: Star,
        title:
          debouncedSearch || selectedGroup
            ? t('aiModelPage.preset.emptySearchTitle')
            : t('aiModelPage.preset.emptyTitle'),
        description:
          debouncedSearch || selectedGroup
            ? t('aiModelPage.preset.emptySearchDescription')
            : t('aiModelPage.preset.emptyDescription'),
      }"
      @retry="loadData"
      @hide-column="toggle"
    >
      <template #empty-action>
        <Button
          v-if="debouncedSearch || selectedGroup"
          variant="outline"
          @click="clearFilters"
        >
          {{ t("aiModelPage.preset.clearFilter") }}
        </Button>
        <Button
          v-else-if="auth.hasPermission('ai_models.presets.create')"
          @click="handleAdd"
        >
          <Plus data-icon="inline-start" />
          {{ t("aiModelPage.preset.add") }}
        </Button>
      </template>

      <template #card="{ row }">
        <RecordCard :title="row.alias" :subtitle="row.modelName">
          <template #badges>
            <Badge variant="outline">{{ row.group }}</Badge>
            <Badge :variant="row.isActive ? 'success' : 'secondary'">
              {{
                row.isActive
                  ? t("aiModelPage.labels.active")
                  : t("aiModelPage.labels.inactive")
              }}
            </Badge>
          </template>
          <template #meta>
            <span>{{
              t("aiModelPage.preset.sortMeta", { order: row.sortOrder })
            }}</span>
          </template>
          <template #actions>
            <RowActions :actions="buildPresetActions(row)" />
          </template>
        </RecordCard>
      </template>

      <template #cell-group="{ row }">
        <Badge variant="outline">{{ row.group }}</Badge>
      </template>
      <template #cell-alias="{ row }">
        <span class="font-medium">{{ row.alias }}</span>
      </template>
      <template #cell-modelName="{ row }">{{ row.modelName }}</template>
      <template #cell-apiUrl="{ row }">{{ row.apiUrl }}</template>
      <template #cell-description="{ row }">
        {{ row.description || "-" }}
      </template>
      <template #cell-status="{ row }">
        <Badge :variant="row.isActive ? 'success' : 'secondary'">
          {{
            row.isActive
              ? t("aiModelPage.labels.active")
              : t("aiModelPage.labels.inactive")
          }}
        </Badge>
      </template>
      <template #cell-sort="{ row }">{{ row.sortOrder }}</template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <Button
            v-if="auth.hasPermission('ai_models.presets.edit')"
            variant="ghost"
            size="icon-sm"
            @click="handleEdit(row)"
          >
            <Pencil />
            <span class="sr-only">{{
              t("aiModelPage.preset.editSrOnly", { name: row.alias })
            }}</span>
          </Button>
          <RowActions
            :actions="
              buildPresetActions(row).filter(
                (item) => item.label !== t('common.edit')
              )
            "
          />
        </div>
      </template>
    </DataList>
  </ListShell>

  <FormDialog
    :open="editOpen"
    :title="
      editingPreset
        ? t('aiModelPage.preset.form.editTitle')
        : t('aiModelPage.preset.form.addTitle')
    "
    :description="
      editingPreset
        ? t('aiModelPage.preset.form.editDescription')
        : t('aiModelPage.preset.form.addDescription')
    "
    :submitting="editSubmitting"
    class="sm:max-w-lg"
    @update:open="editOpen = $event"
    @submit="handleEditSubmit"
  >
    <FieldGroup>
      <Field>
        <FieldLabel for="preset-group">{{
          t("aiModelPage.preset.form.group")
        }}</FieldLabel>
        <Input
          id="preset-group"
          v-model="editForm.group"
          name="preset-group"
          autocomplete="off"
          :placeholder="t('aiModelPage.preset.form.groupPlaceholder')"
          required
        />
        <FieldDescription>
          {{ t("aiModelPage.preset.form.groupHint") }}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel for="preset-alias">{{
          t("aiModelPage.preset.form.alias")
        }}</FieldLabel>
        <Input
          id="preset-alias"
          v-model="editForm.alias"
          name="preset-alias"
          autocomplete="off"
          :spellcheck="false"
          :placeholder="t('aiModelPage.preset.form.aliasPlaceholder')"
          required
          pattern="^[a-zA-Z0-9._-]+$"
          :title="t('aiModelPage.preset.form.aliasPattern')"
        />
      </Field>
      <Field>
        <FieldLabel for="preset-model-name">{{
          t("aiModelPage.preset.form.modelName")
        }}</FieldLabel>
        <Input
          id="preset-model-name"
          v-model="editForm.modelName"
          name="preset-model-name"
          autocomplete="off"
          :spellcheck="false"
          :placeholder="t('aiModelPage.preset.form.modelNamePlaceholder')"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="preset-api-url">{{
          t("aiModelPage.preset.form.apiUrl")
        }}</FieldLabel>
        <Input
          id="preset-api-url"
          v-model="editForm.apiUrl"
          name="preset-api-url"
          autocomplete="off"
          :spellcheck="false"
          type="url"
          :placeholder="t('aiModelPage.preset.form.apiUrlPlaceholder')"
          required
        />
      </Field>
      <Field>
        <FieldLabel for="preset-description">{{
          t("aiModelPage.preset.form.description")
        }}</FieldLabel>
        <Textarea
          id="preset-description"
          v-model="editForm.description"
          name="preset-description"
          autocomplete="off"
          :placeholder="t('aiModelPage.preset.form.descriptionPlaceholder')"
          :rows="2"
        />
      </Field>
      <div class="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel for="preset-sort-order">{{
            t("aiModelPage.preset.form.sortOrder")
          }}</FieldLabel>
          <Input
            id="preset-sort-order"
            :model-value="editForm.sortOrder"
            name="preset-sort-order"
            autocomplete="off"
            type="number"
            :min="0"
            @update:model-value="editForm.sortOrder = Number($event) || 0"
          />
        </Field>
        <Field orientation="horizontal">
          <div class="flex flex-1 flex-col gap-1">
            <FieldLabel for="preset-active">{{
              t("aiModelPage.preset.form.active")
            }}</FieldLabel>
            <FieldDescription>
              {{ t("aiModelPage.preset.form.activeHint") }}
            </FieldDescription>
          </div>
          <Switch
            id="preset-active"
            v-model="editForm.isActive"
            :aria-label="t('aiModelPage.preset.form.activeAria')"
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

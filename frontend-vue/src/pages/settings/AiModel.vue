<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getAiModels,
  createAiModel,
  updateAiModel,
  deleteAiModel,
  testAiModel,
  getActiveAiModelPresets,
  getAiModelPresets,
  getAiModelPresetGroups,
  createAiModelPreset,
  updateAiModelPreset,
  deleteAiModelPreset,
} from '@/lib/api'
import type { AiModel, AiModelPreset } from '@/types/api'
import { useToast } from '@/composables/use-toast'
import Pagination from '@/components/shared/Pagination.vue'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog.vue'
import { Pencil, Trash2, Plus, Search, Eye, EyeOff, Star, TestTube, CheckCircle, XCircle } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToast()

const PAGE_SIZE = 10

const activeTab = ref('models')
const models = ref<AiModel[]>([])
const search = ref('')
const page = ref(1)
const total = ref(0)
const tableLoading = ref(true)
const totalPages = ref(1)
const visibleKeys = ref<Set<string>>(new Set())
const testingId = ref<string | null>(null)
const testResult = ref<{ success: boolean; message: string; responseTime: number | null; model: string | null } | null>(null)

async function loadModels() {
  tableLoading.value = true
  const res = await getAiModels({ search: search.value, page: page.value, pageSize: PAGE_SIZE })
  if (res.code === 0) {
    models.value = res.data.list
    total.value = res.data.total
    totalPages.value = Math.max(1, Math.ceil(res.data.total / PAGE_SIZE))
  } else {
    toast.error(res.message || '加载数据失败')
  }
  tableLoading.value = false
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  page.value = 1
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadModels(), 300)
})

watch(page, () => loadModels())

onMounted(() => loadModels())

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function toggleKeyVisibility(id: string) {
  const next = new Set(visibleKeys.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  visibleKeys.value = next
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '****' + key.slice(-4)
}

// Edit dialog
const editOpen = ref(false)
const editingModel = ref<AiModel | null>(null)
const editForm = ref({
  alias: '',
  modelName: '',
  apiUrl: '',
  apiKey: '',
  description: '',
  isDefault: false,
})
const editSubmitting = ref(false)
const presets = ref<{ alias: string; modelName: string; apiUrl: string; description: string; group: string }[]>([])

async function loadPresets() {
  const res = await getActiveAiModelPresets()
  if (res.code === 0) presets.value = res.data
}

function handleAdd() {
  editingModel.value = null
  editForm.value = { alias: '', modelName: '', apiUrl: '', apiKey: '', description: '', isDefault: false }
  editOpen.value = true
  loadPresets()
}

function handleEdit(model: AiModel) {
  editingModel.value = model
  editForm.value = {
    alias: model.alias,
    modelName: model.modelName,
    apiUrl: model.apiUrl,
    apiKey: model.apiKey,
    description: model.description,
    isDefault: model.isDefault,
  }
  editOpen.value = true
}

async function handleEditSubmit() {
  editSubmitting.value = true
  try {
    const res = editingModel.value
      ? await updateAiModel(editingModel.value.id, editForm.value)
      : await createAiModel(editForm.value)
    if (res.code === 0) {
      toast.success(editingModel.value ? '更新成功' : '创建成功')
      editOpen.value = false
      loadModels()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  editSubmitting.value = false
}

// Delete dialog
const deleteOpen = ref(false)
const deleteTarget = ref<AiModel | null>(null)
const deleteSubmitting = ref(false)

function handleDelete(model: AiModel) {
  deleteTarget.value = model
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  deleteSubmitting.value = true
  try {
    if (deleteTarget.value) {
      const res = await deleteAiModel(deleteTarget.value.id)
      if (res.code === 0) {
        toast.success('删除成功')
        deleteOpen.value = false
        loadModels()
      } else {
        toast.error(res.message || '删除失败')
      }
    }
  } catch {
    toast.error('网络请求失败')
  }
  deleteSubmitting.value = false
}

// Test
async function handleTest(model: AiModel) {
  testingId.value = model.id
  testResult.value = null
  try {
    const res = await testAiModel({
      apiUrl: model.apiUrl,
      apiKey: model.apiKey,
      modelName: model.modelName,
    })
    if (res.code === 0) {
      testResult.value = res.data
    } else {
      testResult.value = { success: false, message: res.message || '测试失败', responseTime: null, model: null }
    }
  } catch {
    testResult.value = { success: false, message: '网络请求失败', responseTime: null, model: null }
  }
  testingId.value = null
}

// Presets tab
const presetPresets = ref<AiModelPreset[]>([])
const presetGroups = ref<string[]>([])
const selectedGroup = ref('')
const presetSearch = ref('')
const presetLoading = ref(true)
const presetEditOpen = ref(false)
const editingPreset = ref<AiModelPreset | null>(null)
const presetEditForm = ref({
  group: '',
  alias: '',
  modelName: '',
  apiUrl: '',
  description: '',
  isActive: true,
  sortOrder: 0,
})
const presetEditSubmitting = ref(false)
const presetDeleteOpen = ref(false)
const presetDeleteTarget = ref<AiModelPreset | null>(null)
const presetDeleteSubmitting = ref(false)

async function loadPresetData() {
  presetLoading.value = true
  const [presetsRes, groupsRes] = await Promise.all([
    getAiModelPresets({ search: presetSearch.value, group: selectedGroup.value }),
    getAiModelPresetGroups(),
  ])
  if (presetsRes.code === 0) presetPresets.value = presetsRes.data
  if (groupsRes.code === 0) presetGroups.value = groupsRes.data
  presetLoading.value = false
}

watch([presetSearch, selectedGroup], () => loadPresetData())

function handlePresetAdd() {
  editingPreset.value = null
  presetEditForm.value = {
    group: presetGroups.value[0] || '',
    alias: '',
    modelName: '',
    apiUrl: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  }
  presetEditOpen.value = true
}

function handlePresetEdit(preset: AiModelPreset) {
  editingPreset.value = preset
  presetEditForm.value = {
    group: preset.group,
    alias: preset.alias,
    modelName: preset.modelName,
    apiUrl: preset.apiUrl,
    description: preset.description,
    isActive: preset.isActive,
    sortOrder: preset.sortOrder,
  }
  presetEditOpen.value = true
}

async function handlePresetEditSubmit() {
  presetEditSubmitting.value = true
  if (editingPreset.value) {
    const res = await updateAiModelPreset(editingPreset.value.id, presetEditForm.value)
    if (res.code !== 0) {
      toast.error(res.message)
      presetEditSubmitting.value = false
      return
    }
  } else {
    const res = await createAiModelPreset(presetEditForm.value)
    if (res.code !== 0) {
      toast.error(res.message)
      presetEditSubmitting.value = false
      return
    }
  }
  presetEditSubmitting.value = false
  presetEditOpen.value = false
  loadPresetData()
}

function handlePresetDelete(preset: AiModelPreset) {
  presetDeleteTarget.value = preset
  presetDeleteOpen.value = true
}

async function handlePresetDeleteConfirm() {
  presetDeleteSubmitting.value = true
  if (presetDeleteTarget.value) {
    await deleteAiModelPreset(presetDeleteTarget.value.id)
  }
  presetDeleteSubmitting.value = false
  presetDeleteOpen.value = false
  loadPresetData()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">AI模型配置</h1>
      <p class="text-base-content/50">管理系统使用的AI模型配置，支持多个模型和自定义别名。</p>
    </div>

    <div role="tablist" class="tabs tabs-border">
      <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'models' }" @click="activeTab = 'models'">模型配置</button>
      <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'presets' }" @click="activeTab = 'presets'; loadPresetData()">预设模型管理</button>
    </div>

    <!-- Models tab -->
    <div v-show="activeTab === 'models'" class="flex flex-col gap-6">
      <div v-if="tableLoading" class="skeleton h-96 w-full"></div>

      <div v-else class="card border border-base-content/10 rounded-xl">
        <div class="card-body">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="card-title">模型列表</h3>
              <p class="text-sm text-base-content/50">共 {{ total }} 个模型配置</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
                <input v-model="search" placeholder="搜索别名或模型名称..." class="input input-bordered input-sm w-full pl-8" />
              </div>
              <button v-if="auth.hasPermission('ai_models.create')" class="btn btn-primary btn-sm" @click="handleAdd">
                <Plus class="size-4" />
                新增模型
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>别名</th>
                  <th>模型名称</th>
                  <th>API 地址</th>
                  <th>API Key</th>
                  <th>描述</th>
                  <th>状态</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="model in models" :key="model.id">
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ model.alias }}</span>
                      <span v-if="model.isDefault" class="badge badge-warning">
                        <Star class="size-3" />
                        默认
                      </span>
                    </div>
                  </td>
                  <td>{{ model.modelName }}</td>
                  <td class="max-w-[200px] truncate text-base-content/50">{{ model.apiUrl }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <code class="text-xs">{{ visibleKeys.has(model.id) ? model.apiKey : maskApiKey(model.apiKey) }}</code>
                      <button class="btn btn-ghost btn-xs" @click="toggleKeyVisibility(model.id)">
                        <EyeOff v-if="visibleKeys.has(model.id)" class="size-3" />
                        <Eye v-else class="size-3" />
                      </button>
                    </div>
                  </td>
                  <td class="max-w-[150px] truncate text-base-content/50">{{ model.description || '-' }}</td>
                  <td>
                    <span :class="model.isDefault ? 'badge badge-primary' : 'badge badge-secondary'">
                      {{ model.isDefault ? '默认' : '普通' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        v-if="auth.hasPermission('ai_models')"
                        class="btn btn-ghost btn-xs"
                        :disabled="testingId === model.id"
                        @click="handleTest(model)"
                      >
                        <span v-if="testingId === model.id" class="loading loading-spinner loading-xs"></span>
                        <TestTube v-else class="size-3" />
                      </button>
                      <button v-if="auth.hasPermission('ai_models.edit')" class="btn btn-ghost btn-xs" @click="handleEdit(model)">
                        <Pencil class="size-3" />
                      </button>
                      <button v-if="auth.hasPermission('ai_models.delete')" class="btn btn-ghost btn-xs" @click="handleDelete(model)">
                        <Trash2 class="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="models.length === 0">
                  <td colspan="7" class="text-center text-base-content/50">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
        </div>
      </div>

      <!-- Edit dialog -->
      <dialog :class="{ modal: true, 'modal-open': editOpen }" @close="editOpen = false">
        <div class="modal-box max-w-lg">
          <h3 class="text-lg font-bold">{{ editingModel ? '编辑模型' : '新增模型' }}</h3>
          <p class="text-sm text-base-content/50">{{ editingModel ? '修改AI模型的配置信息。' : '填写以下信息添加新的AI模型配置，或从预设模型中快速选择。' }}</p>
          <form @submit.prevent="handleEditSubmit">
            <fieldset v-if="!editingModel && presets.length > 0" class="fieldset">
              <legend class="fieldset-legend">快速选择预设模型</legend>
              <select class="select select-bordered w-full" @change="($event) => {
                const preset = presets.find(p => p.alias === ($event.target as HTMLSelectElement).value)
                if (preset) {
                  editForm.alias = preset.alias
                  editForm.modelName = preset.modelName
                  editForm.apiUrl = preset.apiUrl
                  editForm.description = preset.description
                }
              }">
                <option value="">选择常用 AI 模型...</option>
                <option v-for="preset in presets" :key="preset.alias" :value="preset.alias">
                  {{ preset.description ? `${preset.alias} - ${preset.description}` : preset.alias }}
                </option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">别名 *</legend>
              <input v-model="editForm.alias" placeholder="例如: deepseek-chat, gpt-4o" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">模型名称 *</legend>
              <input v-model="editForm.modelName" placeholder="例如: deepseek-chat, gpt-4o" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">API 地址 *</legend>
              <input v-model="editForm.apiUrl" placeholder="例如: https://api.deepseek.com/v1/chat/completions" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">API Key *</legend>
              <input v-model="editForm.apiKey" type="password" placeholder="请输入 API Key" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">描述</legend>
              <textarea v-model="editForm.description" placeholder="请输入模型描述（可选）" class="textarea textarea-bordered w-full" rows="3"></textarea>
            </fieldset>
            <div class="flex items-center justify-between mt-2">
              <span class="font-medium">设为默认模型</span>
              <input type="checkbox" class="toggle toggle-primary" :checked="editForm.isDefault" @change="editForm.isDefault = ($event.target as HTMLInputElement).checked" />
            </div>
            <div class="modal-action">
              <button type="button" class="btn" @click="editOpen = false">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="editSubmitting">
                <span v-if="editSubmitting" class="loading loading-spinner loading-sm"></span>
                {{ editingModel ? '保存' : '创建' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
      </dialog>

      <!-- Test result dialog -->
      <dialog :class="{ modal: true, 'modal-open': testResult !== null }" @close="testResult = null">
        <div class="modal-box max-w-md">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <CheckCircle v-if="testResult?.success" class="size-5 text-success" />
            <XCircle v-else class="size-5 text-error" />
            测试结果
          </h3>
          <p class="text-sm text-base-content/50">{{ testResult?.success ? '模型配置测试成功' : '模型配置测试失败' }}</p>
          <div class="rounded-xl border border-base-content/10 p-4">
            <p class="text-sm">{{ testResult?.message }}</p>
          </div>
          <div v-if="testResult?.responseTime" class="flex items-center justify-between text-sm mt-4">
            <span class="text-base-content/50">响应时间:</span>
            <span class="font-medium">{{ testResult.responseTime }}ms</span>
          </div>
          <div v-if="testResult?.model" class="flex items-center justify-between text-sm">
            <span class="text-base-content/50">实际模型:</span>
            <span class="font-medium">{{ testResult.model }}</span>
          </div>
          <div class="modal-action">
            <button class="btn" @click="testResult = null">关闭</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
      </dialog>

      <ConfirmDeleteDialog
        :open="deleteOpen"
        :target-name="deleteTarget?.alias || ''"
        :loading="deleteSubmitting"
        @update:open="deleteOpen = $event"
        @confirm="handleDeleteConfirm"
      />
    </div>

    <!-- Presets tab -->
    <div v-show="activeTab === 'presets'" class="flex flex-col gap-6">
      <div class="card border border-base-content/10 rounded-xl">
        <div class="card-body">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="card-title">预设模型列表</h3>
              <p class="text-sm text-base-content/50">共 {{ presetPresets.length }} 个预设模型</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select v-model="selectedGroup" class="select select-bordered select-sm w-full sm:w-40">
                <option value="">全部分组</option>
                <option v-for="group in presetGroups" :key="group" :value="group">{{ group }}</option>
              </select>
              <div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
                <input v-model="presetSearch" placeholder="搜索别名或模型名称..." class="input input-bordered input-sm w-full pl-8" />
              </div>
              <button v-if="auth.hasPermission('ai_models.presets.create')" class="btn btn-primary btn-sm" @click="handlePresetAdd">
                <Plus class="size-4" />
                新增预设
              </button>
            </div>
          </div>

          <div v-if="presetLoading" class="skeleton h-48 w-full"></div>

          <div v-else class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>分组</th>
                  <th>别名</th>
                  <th>模型名称</th>
                  <th>API 地址</th>
                  <th>描述</th>
                  <th>状态</th>
                  <th>排序</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="preset in presetPresets" :key="preset.id">
                  <td><span class="badge badge-outline">{{ preset.group }}</span></td>
                  <td class="font-medium">{{ preset.alias }}</td>
                  <td>{{ preset.modelName }}</td>
                  <td class="max-w-[200px] truncate text-base-content/50">{{ preset.apiUrl }}</td>
                  <td class="max-w-[150px] truncate text-base-content/50">{{ preset.description || '-' }}</td>
                  <td>
                    <span :class="preset.isActive ? 'badge badge-primary' : 'badge badge-secondary'">
                      {{ preset.isActive ? '启用' : '禁用' }}
                    </span>
                  </td>
                  <td>{{ preset.sortOrder }}</td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button v-if="auth.hasPermission('ai_models.presets.edit')" class="btn btn-ghost btn-xs" @click="handlePresetEdit(preset)">
                        <Pencil class="size-3" />
                      </button>
                      <button v-if="auth.hasPermission('ai_models.presets.delete')" class="btn btn-ghost btn-xs" @click="handlePresetDelete(preset)">
                        <Trash2 class="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="presetPresets.length === 0">
                  <td colspan="8" class="text-center text-base-content/50">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Preset Edit dialog -->
      <dialog :class="{ modal: true, 'modal-open': presetEditOpen }" @close="presetEditOpen = false">
        <div class="modal-box max-w-lg">
          <h3 class="text-lg font-bold">{{ editingPreset ? '编辑预设模型' : '新增预设模型' }}</h3>
          <p class="text-sm text-base-content/50">{{ editingPreset ? '修改预设模型的配置信息。' : '填写以下信息添加新的预设模型。' }}</p>
          <form @submit.prevent="handlePresetEditSubmit">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">分组 *</legend>
              <input v-model="presetEditForm.group" placeholder="例如: DeepSeek, OpenAI" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">别名 *</legend>
              <input v-model="presetEditForm.alias" placeholder="例如: deepseek-chat, gpt-4o" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">模型名称 *</legend>
              <input v-model="presetEditForm.modelName" placeholder="例如: deepseek-chat, gpt-4o" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">API 地址 *</legend>
              <input v-model="presetEditForm.apiUrl" placeholder="例如: https://api.deepseek.com/v1/chat/completions" class="input input-bordered w-full" required />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">描述</legend>
              <textarea v-model="presetEditForm.description" placeholder="请输入模型描述（可选）" class="textarea textarea-bordered w-full" rows="2"></textarea>
            </fieldset>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">排序</legend>
                <input type="number" v-model.number="presetEditForm.sortOrder" class="input input-bordered w-full" />
              </fieldset>
              <div class="flex items-center justify-between pt-6">
                <span class="font-medium">启用</span>
                <input type="checkbox" class="toggle toggle-primary" :checked="presetEditForm.isActive" @change="presetEditForm.isActive = ($event.target as HTMLInputElement).checked" />
              </div>
            </div>
            <div class="modal-action">
              <button type="button" class="btn" @click="presetEditOpen = false">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="presetEditSubmitting">
                <span v-if="presetEditSubmitting" class="loading loading-spinner loading-sm"></span>
                {{ editingPreset ? '保存' : '创建' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
      </dialog>

      <ConfirmDeleteDialog
        :open="presetDeleteOpen"
        :target-name="presetDeleteTarget?.alias || ''"
        :loading="presetDeleteSubmitting"
        @update:open="presetDeleteOpen = $event"
        @confirm="handlePresetDeleteConfirm"
      />
    </div>
  </div>
</template>

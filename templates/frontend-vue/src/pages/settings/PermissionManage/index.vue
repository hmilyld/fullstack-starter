<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import {
  ChevronRight,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "@lucide/vue"
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog.vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import FormDialog from "@/components/shared/FormDialog.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import RowActions from "@/components/shared/RowActions.vue"
import type { RowAction } from "@/components/shared/row-action"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createPermission,
  deletePermission as apiDeletePermission,
  getPermissions,
  syncPermissions,
  updatePermission,
} from "@/api/permission"
import { useUrlListState } from "@/composables/use-url-list-state"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

type PermissionTreeNode = Permission & {
  children: Permission[]
}

const auth = useAuthStore()
const toast = useToast()
const { search, setSearch } = useUrlListState()

const menuPermissions = ref<Permission[]>([])
const operationPermissions = ref<Permission[]>([])
const expanded = ref<Set<string>>(new Set())
const tableLoading = ref(true)
const error = ref<string | null>(null)
const syncing = ref(false)

async function loadData() {
  tableLoading.value = true
  error.value = null
  const [menuRes, opRes] = await Promise.all([
    getPermissions({ type: "menu" }),
    getPermissions({ type: "operation" }),
  ])
  if (menuRes.code === 0) menuPermissions.value = menuRes.data
  else error.value = menuRes.message || "加载菜单权限失败"
  if (opRes.code === 0) operationPermissions.value = opRes.data
  else error.value = opRes.message || "加载操作权限失败"
  tableLoading.value = false
}

onMounted(() => {
  void loadData()
})

const tree = computed<PermissionTreeNode[]>(() => {
  const fullTree = menuPermissions.value.map((menu) => ({
    ...menu,
    children: operationPermissions.value.filter(
      (operation) => operation.parent === menu.code
    ),
  }))

  if (!search.value) return fullTree

  const keyword = search.value.toLowerCase()
  return fullTree
    .map((node) => {
      const nodeMatch =
        node.code.toLowerCase().includes(keyword) ||
        node.name.toLowerCase().includes(keyword)
      const matchedChildren = node.children.filter(
        (child) =>
          child.code.toLowerCase().includes(keyword) ||
          child.name.toLowerCase().includes(keyword)
      )
      if (nodeMatch || matchedChildren.length > 0) {
        return {
          ...node,
          children: nodeMatch ? node.children : matchedChildren,
        }
      }
      return null
    })
    .filter((node): node is PermissionTreeNode => node !== null)
})

watch(
  [search, tree],
  () => {
    if (search.value) {
      expanded.value = new Set(tree.value.map((node) => node.code))
    }
  },
  { immediate: true }
)

function toggleExpand(code: string) {
  const next = new Set(expanded.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expanded.value = next
}

const editOpen = ref(false)
const editingItem = ref<Permission | null>(null)
const editForm = ref({ code: "", name: "", parent: "" })
const editSubmitting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<Permission | null>(null)
const deleteSubmitting = ref(false)

function handleAddOperation(parentCode: string) {
  editingItem.value = null
  editForm.value = { code: "", name: "", parent: parentCode }
  editOpen.value = true
}

async function handleSync() {
  syncing.value = true
  const res = await syncPermissions()
  syncing.value = false
  if (res.code !== 0) {
    toast.error(res.message || "同步失败")
    return
  }
  toast.success(
    `同步成功：新增 ${res.data.added.length} 个，更新 ${res.data.updated.length} 个，管理员授予 ${res.data.granted.length} 个`
  )
  void loadData()
}

function handleEdit(item: Permission) {
  editingItem.value = item
  editForm.value = {
    code: item.code,
    name: item.name,
    parent: item.parent ?? "",
  }
  editOpen.value = true
}

async function handleEditSubmit() {
  if (!editForm.value.name.trim()) {
    toast.error("请输入权限名称")
    return
  }
  if (!editingItem.value && !editForm.value.parent) {
    toast.error("请选择所属菜单")
    return
  }

  editSubmitting.value = true
  const res = editingItem.value
    ? await updatePermission(editingItem.value.code, {
        name: editForm.value.name,
        parent: editForm.value.parent || undefined,
      })
    : await createPermission({
        code: editForm.value.code,
        name: editForm.value.name,
        type: "operation",
        parent: editForm.value.parent || undefined,
      })
  editSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "操作失败")
    return
  }
  toast.success(editingItem.value ? "保存成功" : "创建成功")
  editOpen.value = false
  void loadData()
}

function handleDelete(item: Permission) {
  deleteTarget.value = item
  deleteOpen.value = true
}

async function handleDeleteConfirm() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  const res = await apiDeletePermission(deleteTarget.value.code)
  deleteSubmitting.value = false
  if (res.code !== 0) {
    toast.error(res.message || "删除失败")
    return
  }
  toast.success("删除成功")
  deleteOpen.value = false
  void loadData()
}

function buildPermissionActions(permission: Permission): RowAction[] {
  const actions: RowAction[] = []
  if (auth.hasPermission("permissions.edit")) {
    actions.push({
      label: "编辑",
      icon: Pencil,
      onSelect: () => handleEdit(permission),
    })
  }
  if (auth.hasPermission("permissions.delete")) {
    actions.push({
      label: "删除",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      onSelect: () => handleDelete(permission),
    })
  }
  return actions
}

const hasPermissions = computed(() => tree.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader title="权限管理" description="管理系统的菜单权限和操作权限。" />

    <ListShell
      title="权限列表"
      :description="`共 ${menuPermissions.length} 个菜单权限，${operationPermissions.length} 个操作权限`"
    >
      <template #actions>
        <InputGroup class="w-full md:w-64">
          <InputGroupInput
            name="q"
            autocomplete="off"
            :spellcheck="false"
            placeholder="搜索编码或名称…"
            aria-label="搜索权限"
            :model-value="search"
            @update:model-value="setSearch(String($event))"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <template v-if="auth.hasPermission('permissions.create')">
          <LoadingButton
            variant="outline"
            :loading="syncing"
            class="w-full md:w-auto"
            @click="handleSync"
          >
            <RefreshCw v-if="!syncing" data-icon="inline-start" />
            同步权限
          </LoadingButton>
          <Button as-child class="w-full md:w-auto">
            <RouterLink to="/settings/menu">
              <Plus data-icon="inline-start" />
              菜单管理
            </RouterLink>
          </Button>
        </template>
      </template>

      <InlineError
        v-if="error && hasPermissions"
        :message="error"
        :on-retry="loadData"
      />

      <TableSkeletonRow v-if="tableLoading" :col-span="4" />
      <ErrorState
        v-else-if="error && !hasPermissions"
        :message="error"
        :on-retry="loadData"
      />
      <EmptyState
        v-else-if="!hasPermissions"
        :icon="KeyRound"
        :title="search ? '没有匹配的权限' : '还没有权限'"
        :description="
          search
            ? '换个关键词，或清空搜索条件后再试。'
            : '在菜单管理中新增菜单后，会自动生成对应的菜单权限。'
        "
      >
        <template
          v-if="search || auth.hasPermission('permissions.create')"
          #action
        >
          <Button v-if="search" variant="outline" @click="setSearch('')">
            清空搜索
          </Button>
          <Button v-else-if="auth.hasPermission('permissions.create')" as-child>
            <RouterLink to="/settings/menu">前往菜单管理</RouterLink>
          </Button>
        </template>
      </EmptyState>

      <template v-else>
        <div class="flex flex-col gap-2 md:hidden">
          <div
            v-for="node in tree"
            :key="node.code"
            class="rounded-2xl border bg-card"
          >
            <div class="flex items-start justify-between gap-2 p-4">
              <div class="flex min-w-0 flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ node.name }}</span>
                  <Badge variant="default">菜单</Badge>
                </div>
                <code class="truncate text-xs text-muted-foreground">
                  {{ node.code }}
                </code>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <Button
                  v-if="auth.hasPermission('permissions.create')"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`新增 ${node.name} 的子权限`"
                  @click="handleAddOperation(node.code)"
                >
                  <Plus />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`${expanded.has(node.code) ? '收起' : '展开'} ${node.name}`"
                  :aria-expanded="expanded.has(node.code)"
                  @click="toggleExpand(node.code)"
                >
                  <ChevronRight
                    :class="
                      cn(
                        'transition-transform',
                        expanded.has(node.code) && 'rotate-90'
                      )
                    "
                  />
                </Button>
              </div>
            </div>
            <div v-if="expanded.has(node.code)" class="border-t p-2">
              <div
                v-for="child in node.children"
                :key="child.code"
                class="flex items-start justify-between gap-2 rounded-xl px-2 py-2"
              >
                <div class="flex min-w-0 flex-col gap-0.5">
                  <span class="truncate text-sm">{{ child.name }}</span>
                  <code class="truncate text-xs text-muted-foreground">
                    {{ child.code }}
                  </code>
                </div>
                <RowActions :actions="buildPermissionActions(child)" />
              </div>
              <p
                v-if="node.children.length === 0"
                class="px-2 py-3 text-sm text-muted-foreground"
              >
                暂无操作权限
              </p>
            </div>
          </div>
        </div>

        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[40%]">权限名称</TableHead>
                <TableHead class="w-[25%]">权限编码</TableHead>
                <TableHead class="w-[10%]">类型</TableHead>
                <TableHead class="w-[25%] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-for="node in tree" :key="node.code">
                <TableRow class="bg-muted/30">
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        :aria-expanded="expanded.has(node.code)"
                        :aria-label="`${expanded.has(node.code) ? '收起' : '展开'} ${node.name}`"
                        @click="toggleExpand(node.code)"
                      >
                        <ChevronRight
                          :class="
                            cn(
                              'transition-transform',
                              expanded.has(node.code) && 'rotate-90'
                            )
                          "
                        />
                      </Button>
                      <span class="font-medium">{{ node.name }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="font-mono text-sm">{{
                    node.code
                  }}</TableCell>
                  <TableCell>
                    <Badge variant="default">菜单</Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <Button
                        v-if="auth.hasPermission('permissions.create')"
                        variant="ghost"
                        size="icon-sm"
                        @click="handleAddOperation(node.code)"
                      >
                        <Plus />
                        <span class="sr-only"
                          >新增 {{ node.name }} 的子权限</span
                        >
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <template v-if="expanded.has(node.code)">
                  <TableRow v-for="child in node.children" :key="child.code">
                    <TableCell>
                      <div class="flex items-center gap-2 pl-9">
                        <span>{{ child.name }}</span>
                      </div>
                    </TableCell>
                    <TableCell class="font-mono text-sm">
                      {{ child.code }}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">操作</Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button
                          v-if="auth.hasPermission('permissions.edit')"
                          variant="ghost"
                          size="icon-sm"
                          @click="handleEdit(child)"
                        >
                          <Pencil />
                          <span class="sr-only">编辑 {{ child.name }}</span>
                        </Button>
                        <Button
                          v-if="auth.hasPermission('permissions.delete')"
                          variant="ghost"
                          size="icon-sm"
                          @click="handleDelete(child)"
                        >
                          <Trash2 />
                          <span class="sr-only">删除 {{ child.name }}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="node.children.length === 0">
                    <TableCell :colspan="4">
                      <div class="pl-9 text-sm text-muted-foreground">
                        暂无操作权限
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
              </template>
            </TableBody>
          </Table>
        </div>
      </template>
    </ListShell>

    <FormDialog
      :open="editOpen"
      :title="editingItem ? '编辑权限' : '新增操作权限'"
      :description="
        editingItem ? '修改权限的基本信息。' : '填写以下信息创建新的操作权限。'
      "
      :submitting="editSubmitting"
      @update:open="editOpen = $event"
      @submit="handleEditSubmit"
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="perm-code">权限编码</FieldLabel>
          <Input
            id="perm-code"
            v-model="editForm.code"
            name="perm-code"
            autocomplete="off"
            :spellcheck="false"
            placeholder="如：users.create"
            required
            :disabled="!!editingItem"
            pattern="^[a-z0-9_.-]+$"
            title="只能包含小写字母、数字、点、下划线和连字符"
          />
        </Field>
        <Field>
          <FieldLabel for="perm-name">权限名称</FieldLabel>
          <Input
            id="perm-name"
            v-model="editForm.name"
            name="perm-name"
            autocomplete="off"
            placeholder="如：新增用户"
            required
          />
        </Field>
        <Field>
          <FieldLabel>所属菜单</FieldLabel>
          <Select v-model="editForm.parent">
            <SelectTrigger class="w-full" aria-label="所属菜单">
              <SelectValue placeholder="请选择所属菜单" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="permission in menuPermissions"
                  :key="permission.code"
                  :value="permission.code"
                >
                  {{ permission.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormDialog>

    <ConfirmDeleteDialog
      :open="deleteOpen"
      :target-name="deleteTarget?.name ?? ''"
      description="删除后，已授予该权限的角色会同步失去此权限。"
      :loading="deleteSubmitting"
      @update:open="deleteOpen = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

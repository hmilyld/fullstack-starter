<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import { ChevronRight, KeyRound, RefreshCw, Search } from "@lucide/vue"
import EmptyState from "@/components/shared/EmptyState.vue"
import ErrorState from "@/components/shared/ErrorState.vue"
import InlineError from "@/components/shared/InlineError.vue"
import ListShell from "@/components/shared/ListShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import TableSkeletonRow from "@/components/shared/TableSkeletonRow.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPermissions, syncPermissions } from "@/api/permission"
import { useUrlListState } from "@/composables/use-url-list-state"
import {
  buildPermissionTree,
  filterPermissionTree,
  type PermissionTreeNode,
} from "@/lib/access-tree"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

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
  const fullTree = buildPermissionTree(
    menuPermissions.value,
    operationPermissions.value
  )
  return filterPermissionTree(fullTree, search.value)
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

const hasPermissions = computed(() => tree.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <PageHeader
      title="权限总览"
      description="只读查看菜单权限与操作权限；日常维护请前往菜单与权限。"
    >
      <template #actions>
        <Button as-child variant="outline">
          <RouterLink to="/settings/menu">
            <KeyRound data-icon="inline-start" />
            菜单与权限
          </RouterLink>
        </Button>
      </template>
    </PageHeader>

    <ListShell
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
        <LoadingButton
          v-if="auth.hasPermission('permissions.create')"
          variant="outline"
          :loading="syncing"
          class="w-full md:w-auto"
          @click="handleSync"
        >
          <RefreshCw v-if="!syncing" data-icon="inline-start" />
          同步权限
        </LoadingButton>
      </template>

      <InlineError
        v-if="error && hasPermissions"
        :message="error"
        :on-retry="loadData"
      />

      <TableSkeletonRow v-if="tableLoading" :col-span="3" />
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
            : '在菜单与权限中新增菜单后，会自动生成对应的菜单权限。'
        "
      >
        <template v-if="search || auth.hasPermission('permissions')" #action>
          <Button v-if="search" variant="outline" @click="setSearch('')">
            清空搜索
          </Button>
          <Button v-else as-child>
            <RouterLink to="/settings/menu">前往菜单与权限</RouterLink>
          </Button>
        </template>
      </EmptyState>

      <template v-else>
        <p class="px-1 text-xs text-muted-foreground">
          隐藏菜单仍会出现在这里；隐藏只影响侧边栏展示，不影响权限与路由访问。
        </p>

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
                <TableHead class="w-[45%]">权限名称</TableHead>
                <TableHead class="w-[45%]">权限编码</TableHead>
                <TableHead class="w-[10%]">类型</TableHead>
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
                  </TableRow>
                  <TableRow v-if="node.children.length === 0">
                    <TableCell :colspan="3">
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
  </div>
</template>

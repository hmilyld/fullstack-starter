<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { ChevronRight, Search } from "@lucide/vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useMediaQuery } from "@/composables/use-media-query"
import { buildPermissionTree, filterPermissionTree } from "@/lib/access-tree"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

const props = defineProps<{
  menuPermissions: Permission[]
  operationPermissions: Permission[]
  modelValue: string[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
  (e: "retry"): void
}>()

type CheckedState = boolean | "indeterminate"

const isCompact = useMediaQuery("(max-width: 767px)")
const search = ref("")
const collapsed = ref<Set<string>>(new Set())

watch(search, () => {
  collapsed.value = new Set()
})

const childrenByMenu = computed(() => {
  const map = new Map<string, Permission[]>()
  for (const operation of props.operationPermissions) {
    if (!operation.parent) continue
    const list = map.get(operation.parent) ?? []
    list.push(operation)
    map.set(operation.parent, list)
  }
  return map
})

const catalogCodes = computed(
  () =>
    new Set([
      ...props.menuPermissions.map((permission) => permission.code),
      ...props.operationPermissions.map((permission) => permission.code),
    ])
)

const selected = computed(() => new Set(props.modelValue))
const selectedCount = computed(
  () =>
    [...selected.value].filter((code) => catalogCodes.value.has(code)).length
)

const tree = computed(() =>
  filterPermissionTree(
    buildPermissionTree(props.menuPermissions, props.operationPermissions),
    search.value
  )
)

function childrenOf(code: string) {
  return childrenByMenu.value.get(code) ?? []
}

function menuState(menu: Permission): CheckedState {
  const children = childrenOf(menu.code)
  const selectedChildren = children.filter((child) =>
    selected.value.has(child.code)
  ).length
  const menuSelected = selected.value.has(menu.code)

  if (children.length === 0) return menuSelected
  if (menuSelected && selectedChildren === children.length) return true
  if (menuSelected || selectedChildren > 0) return "indeterminate"
  return false
}

function toggleCollapsed(code: string) {
  const next = new Set(collapsed.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  collapsed.value = next
}

function toggleMenu(menu: Permission) {
  if (menuState(menu) === true) {
    const childCodes = new Set(childrenOf(menu.code).map((child) => child.code))
    emit(
      "update:modelValue",
      props.modelValue.filter(
        (code) => code !== menu.code && !childCodes.has(code)
      )
    )
    return
  }

  const next = new Set(props.modelValue)
  next.add(menu.code)
  for (const child of childrenOf(menu.code)) next.add(child.code)
  emit("update:modelValue", [...next])
}

function toggleOperation(operation: Permission) {
  const next = new Set(props.modelValue)
  if (next.has(operation.code)) {
    next.delete(operation.code)
  } else {
    next.add(operation.code)
    // 授予操作权限时同时授予其所属菜单，避免出现无入口的孤儿权限。
    if (operation.parent) next.add(operation.parent)
  }
  emit("update:modelValue", [...next])
}

function selectAll() {
  emit("update:modelValue", [...catalogCodes.value])
}

function clearAll() {
  emit("update:modelValue", [])
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="loading"
      class="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground"
    >
      权限加载中…
    </div>
    <div
      v-else-if="error"
      class="flex flex-col items-start gap-2 rounded-xl border p-4 text-sm"
    >
      <span class="text-destructive">{{ error }}</span>
      <Button type="button" variant="outline" size="sm" @click="emit('retry')">
        重试
      </Button>
    </div>
    <div
      v-else-if="menuPermissions.length === 0"
      class="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground"
    >
      暂无可分配的权限
    </div>
    <template v-else>
      <p class="text-xs text-muted-foreground">
        勾选菜单会同时选中其下全部操作，再次点击取消整组；单独勾选操作会保留菜单并显示半选。
      </p>

      <div
        class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <InputGroup class="w-full md:w-64">
          <InputGroupInput
            name="permission-q"
            autocomplete="off"
            :spellcheck="false"
            placeholder="搜索名称或编码…"
            aria-label="搜索权限"
            :model-value="search"
            @update:model-value="search = String($event)"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div class="flex items-center justify-between gap-2 md:justify-end">
          <span class="text-xs text-muted-foreground" aria-live="polite">
            已选 {{ selectedCount }} / {{ catalogCodes.size }} 项
          </span>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              :disabled="catalogCodes.size === 0"
              @click="selectAll"
            >
              全选
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              :disabled="selectedCount === 0"
              @click="clearAll"
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      <div
        v-if="tree.length === 0"
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground"
      >
        <span>没有匹配的权限</span>
        <Button type="button" variant="outline" size="sm" @click="search = ''">
          清空搜索
        </Button>
      </div>
      <div
        v-else-if="isCompact"
        class="flex max-h-[min(50vh,440px)] flex-col gap-2 overflow-y-auto overscroll-contain pr-1"
      >
        <div
          v-for="menu in tree"
          :key="menu.code"
          class="rounded-xl border bg-card"
        >
          <div class="flex items-start gap-2 p-3">
            <Checkbox
              :id="`role-permission-menu-${menu.code}`"
              class="mt-0.5"
              :aria-label="`选择 ${menu.name}`"
              :model-value="menuState(menu)"
              @update:model-value="toggleMenu(menu)"
            />
            <label
              :for="`role-permission-menu-${menu.code}`"
              class="min-w-0 flex-1 cursor-pointer"
            >
              <span class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span class="truncate text-sm font-medium">{{
                  menu.name
                }}</span>
                <span class="text-xs text-muted-foreground">
                  {{
                    childrenOf(menu.code).filter((child) =>
                      selected.has(child.code)
                    ).length
                  }}/{{ childrenOf(menu.code).length }} 个操作
                </span>
              </span>
              <span
                class="block truncate font-mono text-[11px] text-muted-foreground"
              >
                {{ menu.code }}
              </span>
            </label>
            <Button
              v-if="childrenOf(menu.code).length > 0"
              type="button"
              variant="ghost"
              size="icon-sm"
              class="shrink-0"
              :aria-expanded="!collapsed.has(menu.code)"
              :aria-label="`${collapsed.has(menu.code) ? '展开' : '收起'} ${menu.name} 的操作权限`"
              @click="toggleCollapsed(menu.code)"
            >
              <ChevronRight
                :class="
                  cn(
                    'transition-transform',
                    !collapsed.has(menu.code) && 'rotate-90'
                  )
                "
              />
            </Button>
          </div>

          <div
            v-if="!collapsed.has(menu.code) && menu.children.length > 0"
            class="flex flex-col gap-1 border-t p-2"
          >
            <div
              v-for="operation in menu.children"
              :key="operation.code"
              class="flex items-start gap-3 rounded-lg px-2 py-2.5"
            >
              <Checkbox
                :id="`role-permission-op-${operation.code}`"
                class="mt-0.5"
                :aria-label="`选择 ${operation.name}`"
                :model-value="selected.has(operation.code)"
                @update:model-value="toggleOperation(operation)"
              />
              <label
                :for="`role-permission-op-${operation.code}`"
                class="min-w-0 flex-1 cursor-pointer"
              >
                <span class="block truncate text-sm">{{ operation.name }}</span>
                <span
                  class="block truncate font-mono text-[11px] text-muted-foreground"
                >
                  {{ operation.code }}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="max-h-[min(50vh,440px)] overflow-auto overscroll-contain rounded-xl border [&_[data-slot=table-container]]:overflow-visible"
      >
        <Table class="min-w-[520px]">
          <TableHeader class="sticky top-0 z-10 bg-muted">
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-[52%]">权限名称</TableHead>
              <TableHead class="w-[33%]">权限编码</TableHead>
              <TableHead class="w-[15%]">类型</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-for="menu in tree" :key="menu.code">
              <TableRow class="bg-muted/40 hover:bg-muted/60">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :id="`role-permission-menu-${menu.code}`"
                      :aria-label="`选择 ${menu.name}`"
                      :model-value="menuState(menu)"
                      @update:model-value="toggleMenu(menu)"
                    />
                    <Button
                      v-if="childrenOf(menu.code).length > 0"
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      :aria-expanded="!collapsed.has(menu.code)"
                      :aria-label="`${collapsed.has(menu.code) ? '展开' : '收起'} ${menu.name} 的操作权限`"
                      @click="toggleCollapsed(menu.code)"
                    >
                      <ChevronRight
                        :class="
                          cn(
                            'transition-transform',
                            !collapsed.has(menu.code) && 'rotate-90'
                          )
                        "
                      />
                    </Button>
                    <span v-else class="size-6 shrink-0" aria-hidden="true" />
                    <label
                      :for="`role-permission-menu-${menu.code}`"
                      class="min-w-0 cursor-pointer truncate text-sm font-medium"
                    >
                      {{ menu.name }}
                    </label>
                    <span class="shrink-0 text-xs text-muted-foreground">
                      {{
                        childrenOf(menu.code).filter((child) =>
                          selected.has(child.code)
                        ).length
                      }}/{{ childrenOf(menu.code).length }} 个操作
                    </span>
                  </div>
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {{ menu.code }}
                </TableCell>
                <TableCell>
                  <Badge>菜单</Badge>
                </TableCell>
              </TableRow>

              <template v-if="!collapsed.has(menu.code)">
                <TableRow
                  v-for="operation in menu.children"
                  :key="operation.code"
                >
                  <TableCell>
                    <div class="flex items-center gap-2 pl-8">
                      <Checkbox
                        :id="`role-permission-op-${operation.code}`"
                        :aria-label="`选择 ${operation.name}`"
                        :model-value="selected.has(operation.code)"
                        @update:model-value="toggleOperation(operation)"
                      />
                      <label
                        :for="`role-permission-op-${operation.code}`"
                        class="min-w-0 cursor-pointer truncate text-sm"
                      >
                        {{ operation.name }}
                      </label>
                    </div>
                  </TableCell>
                  <TableCell class="font-mono text-xs text-muted-foreground">
                    {{ operation.code }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">操作</Badge>
                  </TableCell>
                </TableRow>
              </template>
            </template>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>

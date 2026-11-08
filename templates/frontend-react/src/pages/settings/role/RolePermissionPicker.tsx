import * as React from "react"
import { ChevronRightIcon, SearchIcon } from "lucide-react"

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
import { useIsMobile } from "@/hooks/use-mobile"
import { buildPermissionTree, filterPermissionTree } from "@/lib/access-tree"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

type RolePermissionPickerProps = {
  menuPermissions: Permission[]
  operationPermissions: Permission[]
  value: string[]
  onChange: (next: string[]) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

type CheckedState = boolean | "indeterminate"

function menuState(
  menu: Permission,
  children: Permission[],
  selected: Set<string>
): CheckedState {
  const selectedChildren = children.filter((child) =>
    selected.has(child.code)
  ).length
  const menuSelected = selected.has(menu.code)

  if (children.length === 0) return menuSelected
  // 只授予菜单本身（未选任何操作）时仍视为已勾选，点击即取消。
  if (menuSelected && selectedChildren === 0) return true
  if (menuSelected && selectedChildren === children.length) return true
  if (menuSelected || selectedChildren > 0) return "indeterminate"
  return false
}

/** 角色权限选择器：菜单 -> 操作两级树，勾选菜单会级联到全部操作。 */
export function RolePermissionPicker({
  menuPermissions,
  operationPermissions,
  value,
  onChange,
  loading,
  error,
  onRetry,
}: RolePermissionPickerProps) {
  const isCompact = useIsMobile()
  const [search, setSearch] = React.useState("")
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  const childrenByMenu = React.useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const operation of operationPermissions) {
      if (!operation.parent) continue
      const list = map.get(operation.parent) ?? []
      list.push(operation)
      map.set(operation.parent, list)
    }
    return map
  }, [operationPermissions])

  const catalogCodes = React.useMemo(
    () =>
      new Set([
        ...menuPermissions.map((permission) => permission.code),
        ...operationPermissions.map((permission) => permission.code),
      ]),
    [menuPermissions, operationPermissions]
  )

  const selected = React.useMemo(() => new Set(value), [value])
  const selectedCount = React.useMemo(
    () => [...selected].filter((code) => catalogCodes.has(code)).length,
    [selected, catalogCodes]
  )

  const tree = React.useMemo(
    () =>
      filterPermissionTree(
        buildPermissionTree(menuPermissions, operationPermissions),
        search
      ),
    [menuPermissions, operationPermissions, search]
  )

  React.useEffect(() => {
    setCollapsed(new Set())
  }, [search])

  function childrenOf(code: string) {
    return childrenByMenu.get(code) ?? []
  }

  function toggleCollapsed(code: string) {
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function toggleMenu(menu: Permission) {
    const state = menuState(menu, childrenOf(menu.code), selected)
    if (state === true) {
      const childCodes = new Set(
        childrenOf(menu.code).map((child) => child.code)
      )
      onChange(
        value.filter((code) => code !== menu.code && !childCodes.has(code))
      )
      return
    }

    const next = new Set(value)
    next.add(menu.code)
    for (const child of childrenOf(menu.code)) next.add(child.code)
    onChange([...next])
  }

  function toggleOperation(operation: Permission) {
    const next = new Set(value)
    if (next.has(operation.code)) {
      next.delete(operation.code)
    } else {
      next.add(operation.code)
      // 授予操作权限时同时授予其所属菜单，避免出现无入口的孤儿权限。
      if (operation.parent) next.add(operation.parent)
    }
    onChange([...next])
  }

  function selectAll() {
    onChange([...catalogCodes])
  }

  function clearAll() {
    onChange([])
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        权限加载中…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border p-4 text-sm">
        <span className="text-destructive">{error}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      </div>
    )
  }

  if (menuPermissions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
        暂无可分配的权限
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        勾选菜单会同时选中其下全部操作，再次点击取消整组；单独勾选操作会保留菜单并显示半选。
      </p>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <InputGroup className="w-full md:w-64">
          <InputGroupInput
            name="permission-q"
            autoComplete="off"
            spellCheck={false}
            placeholder="搜索名称或编码…"
            aria-label="搜索权限"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault()
              }
            }}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            已选 {selectedCount} / {catalogCodes.size} 项
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="max-md:h-11"
              disabled={catalogCodes.size === 0}
              onClick={selectAll}
            >
              全选
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="max-md:h-11"
              disabled={selectedCount === 0}
              onClick={clearAll}
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          <span>没有匹配的权限</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSearch("")}
          >
            清空搜索
          </Button>
        </div>
      ) : isCompact ? (
        <div className="flex max-h-[min(50vh,440px)] scroll-pt-10 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
          {tree.map((menu) => {
            const allChildren = childrenOf(menu.code)
            const checked = menuState(menu, allChildren, selected)
            const expanded = !collapsed.has(menu.code)
            const checkedChildren = allChildren.filter((child) =>
              selected.has(child.code)
            ).length

            return (
              <div key={menu.code} className="rounded-xl border bg-card">
                <div className="flex items-start gap-2 p-3">
                  <Checkbox
                    id={`role-permission-menu-${menu.code}`}
                    className="mt-0.5"
                    aria-label={`选择 ${menu.name}`}
                    checked={checked}
                    onCheckedChange={() => toggleMenu(menu)}
                  />
                  <label
                    htmlFor={`role-permission-menu-${menu.code}`}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="truncate text-sm font-medium">
                        {menu.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {allChildren.length === 0
                          ? "无操作权限"
                          : `${checkedChildren}/${allChildren.length} 个操作`}
                      </span>
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {menu.code}
                    </span>
                  </label>
                  {allChildren.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "收起" : "展开"} ${menu.name} 的操作权限`}
                      onClick={() => toggleCollapsed(menu.code)}
                    >
                      <ChevronRightIcon
                        className={cn(
                          "transition-transform",
                          expanded && "rotate-90"
                        )}
                      />
                    </Button>
                  )}
                </div>

                {expanded && menu.children.length > 0 && (
                  <div className="flex flex-col gap-1 border-t p-2">
                    {menu.children.map((operation) => (
                      <div
                        key={operation.code}
                        className="flex items-start gap-3 rounded-lg px-2 py-2.5"
                      >
                        <Checkbox
                          id={`role-permission-op-${operation.code}`}
                          className="mt-0.5"
                          aria-label={`选择 ${operation.name}`}
                          checked={selected.has(operation.code)}
                          onCheckedChange={() => toggleOperation(operation)}
                        />
                        <label
                          htmlFor={`role-permission-op-${operation.code}`}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="block truncate text-sm">
                            {operation.name}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {operation.code}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="max-h-[min(50vh,440px)] scroll-pt-10 overflow-auto overscroll-contain rounded-xl border [&_[data-slot=table-container]]:overflow-visible">
          <Table className="min-w-[520px]">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[52%]">权限名称</TableHead>
                <TableHead className="w-[33%]">权限编码</TableHead>
                <TableHead className="w-[15%]">类型</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.map((menu) => {
                const allChildren = childrenOf(menu.code)
                const checked = menuState(menu, allChildren, selected)
                const expanded = !collapsed.has(menu.code)
                const checkedChildren = allChildren.filter((child) =>
                  selected.has(child.code)
                ).length

                return (
                  <React.Fragment key={menu.code}>
                    <TableRow className="bg-muted/40 hover:bg-muted/60">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`role-permission-menu-${menu.code}`}
                            aria-label={`选择 ${menu.name}`}
                            checked={checked}
                            onCheckedChange={() => toggleMenu(menu)}
                          />
                          {allChildren.length > 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-expanded={expanded}
                              aria-label={`${expanded ? "收起" : "展开"} ${menu.name} 的操作权限`}
                              onClick={() => toggleCollapsed(menu.code)}
                            >
                              <ChevronRightIcon
                                className={cn(
                                  "transition-transform",
                                  expanded && "rotate-90"
                                )}
                              />
                            </Button>
                          ) : (
                            <span className="size-6 shrink-0" aria-hidden />
                          )}
                          <label
                            htmlFor={`role-permission-menu-${menu.code}`}
                            className="min-w-0 cursor-pointer truncate text-sm font-medium"
                          >
                            {menu.name}
                          </label>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {allChildren.length === 0
                              ? "无操作权限"
                              : `${checkedChildren}/${allChildren.length} 个操作`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {menu.code}
                      </TableCell>
                      <TableCell>
                        <Badge>菜单</Badge>
                      </TableCell>
                    </TableRow>

                    {expanded &&
                      menu.children.map((operation) => (
                        <TableRow key={operation.code}>
                          <TableCell>
                            <div className="flex items-center gap-2 pl-8">
                              <Checkbox
                                id={`role-permission-op-${operation.code}`}
                                aria-label={`选择 ${operation.name}`}
                                checked={selected.has(operation.code)}
                                onCheckedChange={() =>
                                  toggleOperation(operation)
                                }
                              />
                              <label
                                htmlFor={`role-permission-op-${operation.code}`}
                                className="min-w-0 cursor-pointer truncate text-sm"
                              >
                                {operation.name}
                              </label>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {operation.code}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">操作</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

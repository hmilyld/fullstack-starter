import * as React from "react"
import { Link } from "react-router"
import {
  ChevronRightIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { InlineError } from "@/components/shared/inline-error"
import { ListShell } from "@/components/shared/list-shell"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeletonRow } from "@/components/shared/table-states"
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
import { useUrlListState } from "@/hooks/use-url-list-state"
import {
  buildPermissionTree,
  filterPermissionTree,
  type PermissionTreeNode,
} from "@/lib/access-tree"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types/permission"

export function PermissionPage() {
  const { hasPermission } = useAuth()
  const [menuPermissions, setMenuPermissions] = React.useState<Permission[]>([])
  const [operationPermissions, setOperationPermissions] = React.useState<
    Permission[]
  >([])
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const { search, setSearch } = useUrlListState()
  const [tableLoading, setTableLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [syncing, setSyncing] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setTableLoading(true)
    setError(null)
    const [menuRes, opRes] = await Promise.all([
      getPermissions({ type: "menu" }),
      getPermissions({ type: "operation" }),
    ])
    if (menuRes.code === 0) setMenuPermissions(menuRes.data)
    else setError(menuRes.message || "加载菜单权限失败")
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    else setError(opRes.message || "加载操作权限失败")
    setTableLoading(false)
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const tree = React.useMemo(() => {
    const fullTree = buildPermissionTree(menuPermissions, operationPermissions)
    return filterPermissionTree(fullTree, search)
  }, [menuPermissions, operationPermissions, search])

  React.useEffect(() => {
    if (search) {
      setExpanded(new Set(tree.map((node) => node.code)))
    }
  }, [search, tree])

  function toggleExpand(code: string) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  async function handleSync() {
    setSyncing(true)
    const res = await syncPermissions()
    setSyncing(false)
    if (res.code !== 0) {
      appToast.error(res.message || "同步失败")
      return
    }
    appToast.success(
      `同步成功：新增 ${res.data.added.length} 个，更新 ${res.data.updated.length} 个，管理员授予 ${res.data.granted.length} 个`
    )
    void loadData()
  }

  const hasPermissions = tree.length > 0

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="权限总览"
        description="只读查看菜单权限与操作权限；日常维护请前往菜单与权限。"
        actions={
          <Button asChild variant="outline">
            <Link to="/settings/menu">
              <KeyRoundIcon data-icon="inline-start" />
              菜单与权限
            </Link>
          </Button>
        }
      />

      <ListShell
        description={`共 ${menuPermissions.length} 个菜单权限，${operationPermissions.length} 个操作权限`}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder="搜索编码或名称…"
                aria-label="搜索权限"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            {hasPermission("permissions.create") && (
              <LoadingButton
                variant="outline"
                onClick={handleSync}
                loading={syncing}
                className="w-full md:w-auto"
              >
                {!syncing && <RefreshCwIcon data-icon="inline-start" />}
                同步权限
              </LoadingButton>
            )}
          </>
        }
      >
        {error && hasPermissions && (
          <InlineError message={error} onRetry={loadData} />
        )}

        {tableLoading ? (
          <TableSkeletonRow colSpan={3} />
        ) : error && !hasPermissions ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : !hasPermissions ? (
          <EmptyState
            icon={KeyRoundIcon}
            title={search ? "没有匹配的权限" : "还没有权限"}
            description={
              search
                ? "换个关键词，或清空搜索条件后再试。"
                : "在菜单与权限中新增菜单后，会自动生成对应的菜单权限。"
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  清空搜索
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/settings/menu">前往菜单与权限</Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              隐藏菜单仍会出现在这里；隐藏只影响侧边栏展示，不影响权限与路由访问。
            </p>

            <div className="flex flex-col gap-2 md:hidden">
              {tree.map((node) => {
                const isExpanded = expanded.has(node.code)

                return (
                  <div key={node.code} className="rounded-2xl border bg-card">
                    <div className="flex items-start justify-between gap-2 p-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{node.name}</span>
                          <Badge variant="default">菜单</Badge>
                        </div>
                        <code className="truncate text-xs text-muted-foreground">
                          {node.code}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${isExpanded ? "收起" : "展开"} ${node.name}`}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(node.code)}
                      >
                        <ChevronRightIcon
                          className={cn(
                            "transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="border-t p-2">
                        {node.children.map((child) => (
                          <div
                            key={child.code}
                            className="flex items-start justify-between gap-2 rounded-xl px-2 py-2"
                          >
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm">
                                {child.name}
                              </span>
                              <code className="truncate text-xs text-muted-foreground">
                                {child.code}
                              </code>
                            </div>
                          </div>
                        ))}
                        {node.children.length === 0 && (
                          <p className="px-2 py-3 text-sm text-muted-foreground">
                            暂无操作权限
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">权限名称</TableHead>
                    <TableHead className="w-[45%]">权限编码</TableHead>
                    <TableHead className="w-[10%]">类型</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tree.map((node: PermissionTreeNode) => {
                    const isExpanded = expanded.has(node.code)

                    return (
                      <React.Fragment key={node.code}>
                        <TableRow className="bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? "收起" : "展开"} ${node.name}`}
                                onClick={() => toggleExpand(node.code)}
                              >
                                <ChevronRightIcon
                                  className={cn(
                                    "transition-transform",
                                    isExpanded && "rotate-90"
                                  )}
                                />
                              </Button>
                              <span className="font-medium">{node.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {node.code}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">菜单</Badge>
                          </TableCell>
                        </TableRow>

                        {isExpanded &&
                          node.children.map((child) => (
                            <TableRow key={child.code}>
                              <TableCell>
                                <div className="flex items-center gap-2 pl-9">
                                  <span>{child.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {child.code}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">操作</Badge>
                              </TableCell>
                            </TableRow>
                          ))}

                        {isExpanded && node.children.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <div className="pl-9 text-sm text-muted-foreground">
                                暂无操作权限
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ListShell>
    </div>
  )
}

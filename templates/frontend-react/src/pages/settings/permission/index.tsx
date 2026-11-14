import * as React from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
    else setError(menuRes.message || t("permissionPage.loadMenuFailed"))
    if (opRes.code === 0) setOperationPermissions(opRes.data)
    else setError(opRes.message || t("permissionPage.loadOperationFailed"))
    setTableLoading(false)
  }, [t])

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
      appToast.error(res.message || t("permissionPage.syncFailed"))
      return
    }
    appToast.success(
      t("permissionPage.syncSuccess", {
        added: res.data.added.length,
        updated: res.data.updated.length,
        granted: res.data.granted.length,
      })
    )
    void loadData()
  }

  const hasPermissions = tree.length > 0

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title={t("permissionPage.title")}
        description={t("permissionPage.description")}
        actions={
          <Button asChild variant="outline">
            <Link to="/settings/menu">
              <KeyRoundIcon data-icon="inline-start" />
              {t("permissionPage.menuLink")}
            </Link>
          </Button>
        }
      />

      <ListShell
        description={t("permissionPage.listDescription", {
          menus: menuPermissions.length,
          ops: operationPermissions.length,
        })}
        actions={
          <>
            <InputGroup className="w-full md:w-64">
              <InputGroupInput
                name="q"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("permissionPage.searchPlaceholder")}
                aria-label={t("permissionPage.searchAria")}
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
                {t("permissionPage.sync")}
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
            title={
              search
                ? t("permissionPage.emptySearchTitle")
                : t("permissionPage.emptyTitle")
            }
            description={
              search
                ? t("permissionPage.emptySearchDescription")
                : t("permissionPage.emptyDescription")
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  {t("permissionPage.clearSearch")}
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/settings/menu">
                    {t("permissionPage.goToMenus")}
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              {t("permissionPage.hiddenNote")}
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
                          <Badge variant="default">
                            {t("permissionPage.menuType")}
                          </Badge>
                        </div>
                        <code className="truncate text-xs text-muted-foreground">
                          {node.code}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t(
                          isExpanded
                            ? "permissionPage.collapseAria"
                            : "permissionPage.expandAria",
                          { name: node.name }
                        )}
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
                            {t("permissionPage.noOperations")}
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
                    <TableHead className="w-[45%]">
                      {t("permissionPage.nameHeader")}
                    </TableHead>
                    <TableHead className="w-[45%]">
                      {t("permissionPage.codeHeader")}
                    </TableHead>
                    <TableHead className="w-[10%]">
                      {t("permissionPage.typeHeader")}
                    </TableHead>
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
                                aria-label={t(
                                  isExpanded
                                    ? "permissionPage.collapseAria"
                                    : "permissionPage.expandAria",
                                  { name: node.name }
                                )}
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
                            <Badge variant="default">
                              {t("permissionPage.menuType")}
                            </Badge>
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
                                <Badge variant="secondary">
                                  {t("permissionPage.operationType")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}

                        {isExpanded && node.children.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <div className="pl-9 text-sm text-muted-foreground">
                                {t("permissionPage.noOperations")}
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

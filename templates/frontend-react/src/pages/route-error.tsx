import { useTranslation } from "react-i18next"
import { TriangleAlertIcon } from "lucide-react"
import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

/** 路由级错误页：渲染异常或 loader 失败时展示 */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t("errors.refreshHint")

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        className="max-w-lg"
        icon={TriangleAlertIcon}
        title={t("errors.pageLoadFailed")}
        description={message}
        action={
          <Button asChild>
            <Link to="/dashboard">{t("errors.backToDashboard")}</Link>
          </Button>
        }
      />
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { CompassIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        className="max-w-lg"
        icon={CompassIcon}
        title={t("errors.notFoundTitle")}
        description={t("errors.notFoundDescription")}
        action={
          <Button asChild>
            <Link to="/dashboard">{t("errors.backToDashboard")}</Link>
          </Button>
        }
      />
    </div>
  )
}

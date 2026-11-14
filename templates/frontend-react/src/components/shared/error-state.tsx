import { useTranslation } from "react-i18next"
import { CircleAlertIcon, RefreshCwIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

/** 列表加载失败时的统一提示 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={CircleAlertIcon}
      title={t("common.loadFailed")}
      description={message}
      action={
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          {t("common.retry")}
        </Button>
      }
    />
  )
}

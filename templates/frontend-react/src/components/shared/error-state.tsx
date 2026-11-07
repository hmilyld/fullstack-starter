import { CircleAlertIcon, RefreshCwIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

/** 列表加载失败时的统一提示 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={CircleAlertIcon}
      title="加载失败"
      description={message}
      action={
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          重试
        </Button>
      }
    />
  )
}

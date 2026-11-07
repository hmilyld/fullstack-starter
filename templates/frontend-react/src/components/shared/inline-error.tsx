import { CircleAlertIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type InlineErrorProps = {
  message: string
  onRetry: () => void
}

/** 保留旧数据时，在列表上方提示刷新失败 */
export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <CircleAlertIcon />
      <AlertTitle>刷新失败</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="xs" onClick={onRetry}>
          重试
        </Button>
      </AlertAction>
    </Alert>
  )
}

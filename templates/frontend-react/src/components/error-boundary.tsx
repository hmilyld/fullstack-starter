import * as React from "react"
import { useTranslation } from "react-i18next"
import { TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

function ErrorFallback({ error }: { error: Error }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        className="max-w-lg"
        icon={TriangleAlertIcon}
        title={t("errors.pageLoadFailed")}
        description={error.message || t("errors.refreshHint")}
        action={
          <Button onClick={() => window.location.reload()}>
            {t("errors.reload")}
          </Button>
        }
      />
    </div>
  )
}

/** 兜底捕获渲染异常，避免整页白屏 */
class ErrorBoundaryInner extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI render failed", error, info)
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>
}

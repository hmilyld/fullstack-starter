import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

/** 兜底捕获渲染异常，避免整页白屏 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("界面渲染失败", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh items-center justify-center p-6">
          <EmptyState
            className="max-w-lg"
            icon={TriangleAlertIcon}
            title="页面加载失败"
            description={this.state.error.message || "请刷新页面重试。"}
            action={
              <Button onClick={() => window.location.reload()}>刷新页面</Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}

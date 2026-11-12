import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type BulkActionsBarProps = {
  count: number
  /** 单位，如「位用户」「条记录」 */
  entityName: string
  onClear: () => void
  children?: React.ReactNode
}

/**
 * 批量操作条：固定在底部居中，带读屏播报、Esc 清除与方向键切换。
 * 不占布局空间，长列表滚动时仍然可见。
 */
export function BulkActionsBar({
  count,
  entityName,
  onClear,
  children,
}: BulkActionsBarProps) {
  const barRef = React.useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = React.useState("")

  React.useEffect(() => {
    if (count === 0) {
      setAnnouncement("")
      return
    }
    setAnnouncement(`已选中 ${count} ${entityName}，批量操作可用`)
    const timer = window.setTimeout(() => setAnnouncement(""), 3000)
    return () => window.clearTimeout(timer)
  }, [count, entityName])

  React.useEffect(() => {
    if (count === 0) return

    function isInsideOverlay(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      return Boolean(
        target.closest(
          '[role="dialog"], [data-slot="dropdown-menu-content"], [data-slot="select-content"]'
        )
      )
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (isInsideOverlay(event.target)) return
      onClear()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [count, onClear])

  function handleBarKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
    const buttons = Array.from(
      barRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
    ).filter((button) => !button.disabled)
    if (buttons.length === 0) return

    event.preventDefault()
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (event.key === "ArrowRight") next = (current + 1) % buttons.length
    else if (event.key === "ArrowLeft")
      next = current <= 0 ? buttons.length - 1 : current - 1
    else if (event.key === "End") next = buttons.length - 1
    buttons[next]?.focus()
  }

  if (count === 0) return null

  return createPortal(
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div
        ref={barRef}
        role="toolbar"
        aria-label={`批量操作，已选 ${count} ${entityName}`}
        tabIndex={-1}
        onKeyDown={handleBarKeyDown}
        className={cn(
          "fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:bottom-6",
          "animate-in duration-200 ease-out fade-in-0 slide-in-from-bottom-2",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex items-center gap-2 rounded-xl border bg-background/95 p-1.5 shadow-xl backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClear}
            aria-label="清除选择"
            title="清除选择（Esc）"
            className="rounded-full"
          >
            <XIcon />
          </Button>
          <Separator
            orientation="vertical"
            className="h-5"
            aria-hidden="true"
          />
          <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Badge className="min-w-6 justify-center rounded-md px-1.5 tabular-nums">
              {count}
            </Badge>
            <span className="text-muted-foreground">{entityName}</span>
          </span>
          {children && (
            <>
              <Separator
                orientation="vertical"
                className="h-5"
                aria-hidden="true"
              />
              {children}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

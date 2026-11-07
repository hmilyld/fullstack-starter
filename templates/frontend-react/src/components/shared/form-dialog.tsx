import type { FormEvent, ReactNode } from "react"

import { LoadingButton } from "@/components/shared/loading-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  submitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  className?: string
}

/**
 * 新增/编辑弹窗统一结构。
 * 头部与底部固定，中间内容在弹窗内滚动，手机和桌面共用同一套行为。
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitting = false,
  submitLabel = "保存",
  cancelLabel = "取消",
  onSubmit,
  children,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-var(--dialog-inset)*2)] flex-col gap-0 overflow-hidden p-0",
          className
        )}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b p-4 pr-14 md:p-6 md:pr-14">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            {children}
          </div>
          <DialogFooter className="flex-row justify-end border-t bg-popover p-4 md:p-6">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <LoadingButton type="submit" loading={submitting}>
              {submitLabel}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

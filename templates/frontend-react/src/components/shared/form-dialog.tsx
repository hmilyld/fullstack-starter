import type { FormEvent, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/shared/loading-button"

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

/** 新增/编辑弹窗统一结构：标题、表单、取消 + 提交 */
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
      <DialogContent className={className}>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
          <DialogFooter>
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

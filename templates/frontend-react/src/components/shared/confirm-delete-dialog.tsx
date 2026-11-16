import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  description?: ReactNode
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  targetName,
  description,
  onConfirm,
  loading,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDelete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("common.confirmDelete.prefix")}{" "}
            <span className="font-medium text-foreground">{targetName}</span>{" "}
            {t("common.confirmDelete.suffix")}
            {description && <>{description}</>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("common.confirmDelete.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <Spinner data-icon="inline-start" decorative />}
            {t("common.confirmDelete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

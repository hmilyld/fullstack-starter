import { useTranslation } from "react-i18next"
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

type ConfirmHideDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  onConfirm: () => void
  loading?: boolean
}

/** 隐藏关键导航入口前的确认，避免管理员找不到恢复入口。 */
export function ConfirmHideDialog({
  open,
  onOpenChange,
  targetName,
  onConfirm,
  loading,
}: ConfirmHideDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmHide.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("common.confirmHide.prefix")}{" "}
            <span className="font-medium text-foreground">{targetName}</span>{" "}
            {t("common.confirmHide.suffix")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("common.confirmHide.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
          >
            {loading && <Spinner data-icon="inline-start" />}
            {t("common.confirmHide.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

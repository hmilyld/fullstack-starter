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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认隐藏菜单</AlertDialogTitle>
          <AlertDialogDescription>
            隐藏{" "}
            <span className="font-medium text-foreground">{targetName}</span>{" "}
            后，侧边栏将不再显示该入口。如果这是「菜单与权限」或「系统设置」入口，你仍可通过
            /settings/menu 直接访问并重新显示。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
          >
            {loading && <Spinner data-icon="inline-start" />}
            隐藏
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

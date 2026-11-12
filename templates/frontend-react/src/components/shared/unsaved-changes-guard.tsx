import * as React from "react"
import { useBlocker } from "react-router"

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

/**
 * 有未保存修改时：刷新/关闭浏览器走原生提示，站内跳转用弹窗确认。
 * 只挂载在表单页，`when` 变化时自动登记/解除。
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  // 只拦截离开当前页面的跳转；同一页面的 tab / 查询参数变化不算离开
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  )

  React.useEffect(() => {
    if (!when) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [when])

  return (
    <AlertDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open) blocker.reset?.()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
          <AlertDialogDescription>
            当前页面还有未保存的内容，离开后这些修改会丢失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>留在本页</AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.proceed?.()}>
            放弃修改
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

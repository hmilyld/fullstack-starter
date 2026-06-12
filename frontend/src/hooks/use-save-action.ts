import * as React from "react"
import type { ApiResponse } from "@/types/api"

type UseSaveActionOptions = {
  successMessage?: string
  duration?: number
}

type UseSaveActionReturn = {
  saving: boolean
  message: string
  execute: <T>(fn: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T> | null>
}

export function useSaveAction(options?: UseSaveActionOptions): UseSaveActionReturn {
  const { successMessage = "保存成功", duration = 3000 } = options ?? {}
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState("")

  const execute = React.useCallback(
    async <T,>(fn: () => Promise<ApiResponse<T>>) => {
      setSaving(true)
      const res = await fn()
      setSaving(false)
      setMessage(res.code === 0 ? successMessage : res.message)
      setTimeout(() => setMessage(""), duration)
      return res
    },
    [successMessage, duration]
  )

  return { saving, message, execute }
}

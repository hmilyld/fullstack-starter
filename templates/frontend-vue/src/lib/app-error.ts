import { ref } from "vue"

export const appError = ref<string | null>(null)

export function setAppError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  appError.value = message || "页面加载失败，请刷新后重试。"
}

export function clearAppError() {
  if (appError.value) appError.value = null
}

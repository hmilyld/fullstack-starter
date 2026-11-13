let appError = $state<string | null>(null)

export function getAppError() {
  return appError
}

export function setAppError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  appError = message || "页面加载失败，请刷新后重试。"
}

export function clearAppError() {
  if (appError) appError = null
}

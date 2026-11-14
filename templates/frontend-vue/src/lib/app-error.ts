import { ref } from "vue"

import i18n from "@/lib/i18n"

export const appError = ref<string | null>(null)

export function setAppError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  appError.value = message || i18n.global.t("errors.pageLoadFallback")
}

export function clearAppError() {
  if (appError.value) appError.value = null
}

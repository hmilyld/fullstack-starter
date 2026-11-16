import { beforeEach } from "vitest"

import {
  changeLocale,
  LOCALE_PREFERENCE_KEY,
  LOCALE_STORAGE_KEY,
} from "#lib/i18n.js"

// 所有测试默认使用简体中文，并回到「用户未主动选择语言」的状态；
// 单个用例切换语言后由自身的 afterEach 恢复。
beforeEach(async () => {
  await changeLocale("zh-CN")
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY)
  }
})

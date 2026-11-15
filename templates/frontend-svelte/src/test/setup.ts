import { beforeEach } from "vitest"

import { changeLocale } from "#lib/i18n.js"

// 所有测试默认使用简体中文；单个用例切换语言后自动恢复，避免相互影响。
beforeEach(async () => {
  await changeLocale("zh-CN")
})

import path from "node:path"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx,vue}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 覆盖率聚焦可单元测试的共享层；页面交互由 smoke test 与三端手工验收覆盖
      include: [
        "src/api/http.ts",
        "src/components/shared/**/*.{ts,vue}",
        "src/composables/**/*.{ts,vue}",
        "src/lib/**/*.{ts,vue}",
        "src/stores/**/*.ts",
        "src/pages/settings/UserManage/index.vue",
        "src/pages/settings/MenuManage/menu-drag.ts",
      ],
      exclude: ["src/**/*.test.*", "src/test/**", "src/**/*.d.ts"],
    },
  },
})

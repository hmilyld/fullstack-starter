import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", "coverage", "test-results", "playwright-report"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // 构建时注入，见 vite.config.ts 的 define
        __APP_VERSION__: "readonly",
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Page components live under `pages/**/index.vue`, so their names are not multi-word.
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
    },
  },
])

import prettier from "eslint-config-prettier"
import path from "node:path"
import js from "@eslint/js"
import svelte from "eslint-plugin-svelte"
import { defineConfig, includeIgnoreFile } from "eslint/config"
import globals from "globals"
import ts from "typescript-eslint"

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore")

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      // 菜单路由来自后端配置，无法全部写成 Kit 的静态 route id
      "svelte/no-navigation-without-resolve": "off",
      // Set/Map/Date 多数是请求去重与数据计算，不是响应式状态
      "svelte/prefer-svelte-reactivity": "off",
      "svelte/no-useless-children-snippet": "off",
    },
  },
  {
    files: ["**/*.svelte"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  }
)

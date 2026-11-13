import { readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import { playwright } from "@vitest/browser-playwright"
import adapter from "@sveltejs/adapter-static"
import { withPwa } from "@vite-pwa/sveltekit"
import { defineConfig } from "vitest/config"

// 本地联调时可指向 Python（8088）或 Java（8089）后端
const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:8088"

// 页脚展示的版本号始终与 package.json 一致（发布新版本时只需改 package.json）
const appVersion = (
  JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
  ) as { version: string }
).version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    tailwindcss(),
    withPwa(
      {
        compilerOptions: {
          // 业务代码强制 runes；依赖库不强制
          runes: ({ filename }) =>
            filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        },
        adapter: adapter({
          pages: "dist",
          assets: "dist",
          fallback: "index.html",
          strict: false,
        }),
      },
      {
        registerType: "autoUpdate",
        injectRegister: "auto",
        strategies: "generateSW",
        manifest: {
          name: "管理系统",
          short_name: "管理系统",
          description: "基于 Svelte 5 + shadcn-svelte 的后台管理框架",
          lang: "zh-CN",
          id: "/",
          orientation: "any",
          categories: ["business", "productivity"],
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/icons/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        generateSW: {
          globStrict: false,
          globPatterns: [
            "client/**/*.{js,css,html,ico,png,svg,woff2,webmanifest}",
          ],
          globIgnores: ["prerendered/**"],
        },
        kit: {
          adapterFallback: "index.html",
          spa: true,
        },
      }
    ),
  ],
  resolve: {
    // Svelte 官方测试文档要求：Vitest 下使用 package.json 的 browser 入口
    conditions: process.env.VITEST ? ["browser"] : undefined,
  },
  server: {
    port: 5173,
    host: "localhost",
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "localhost",
  },
  test: {
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["src/**/*.svelte.test.ts"],
          exclude: ["src/lib/server/**"],
        },
      },
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.svelte.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/api/http.ts",
        "src/lib/components/shared/**/*.{ts,svelte}",
        "src/lib/hooks/**/*.ts",
        "src/lib/**/*.ts",
        "src/lib/stores/**/*.ts",
      ],
      exclude: ["src/**/*.test.ts", "src/**/*.svelte.test.ts", "src/test/**"],
    },
  },
})

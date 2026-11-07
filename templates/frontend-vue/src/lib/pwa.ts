import type { PublicConfig } from "@/types/system"

export type PwaTheme = "light" | "dark"

const DEFAULT_NAME = "管理系统"
const DEFAULT_DESCRIPTION = "基于 Vue 3 + shadcn-vue 的后台管理框架"

export type PwaManifest = {
  name: string
  short_name: string
  description: string
  lang: string
  dir: "ltr" | "rtl"
  id: string
  start_url: string
  scope: string
  display: "standalone"
  orientation: "any"
  theme_color: string
  background_color: string
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose: string
  }>
  categories: string[]
}

/** 根据站点配置与当前主题生成 manifest，避免写死站点名和颜色 */
export function buildPwaManifest(
  config: PublicConfig | null,
  theme: PwaTheme
): PwaManifest {
  const name = config?.siteName?.trim() || DEFAULT_NAME
  const shortName = [...name].slice(0, 12).join("")
  const background = theme === "dark" ? "#0a0a0a" : "#ffffff"

  return {
    name,
    short_name: shortName,
    description: config?.siteDescription?.trim() || DEFAULT_DESCRIPTION,
    lang: "zh-CN",
    dir: "ltr",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: background,
    background_color: background,
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
    categories: ["business", "productivity"],
  }
}

/**
 * 把 manifest 写入 link/meta。
 * 使用 Blob URL 以便站点名称、描述和主题色随运行时配置变化。
 * 返回当前 Blob URL，便于下一次更新时释放。
 */
export function applyPwaManifest(manifest: PwaManifest): string {
  // 老浏览器或受限环境（例如部分 WebView）不支持 Blob URL 时保留静态 manifest
  if (
    typeof Blob === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return ""
  }

  try {
    return writeManifest(manifest)
  } catch {
    return ""
  }
}

function writeManifest(manifest: PwaManifest): string {
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  })
  const url = URL.createObjectURL(blob)

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) {
    link = document.createElement("link")
    link.rel = "manifest"
    document.head.appendChild(link)
  }

  const previous = link.dataset.dynamicHref
  link.href = url
  link.dataset.dynamicHref = url
  if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous)

  setMeta("theme-color", manifest.theme_color)
  setMeta("application-name", manifest.name)
  setMeta("apple-mobile-web-app-title", manifest.name)
  setMeta(
    "apple-mobile-web-app-status-bar-style",
    manifest.theme_color === "#0a0a0a" ? "black-translucent" : "default"
  )

  return url
}

function setMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement("meta")
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

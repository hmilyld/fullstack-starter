/**
 * 页面标题组合：`页面 · 站点名`。
 * 路由与站点配置各自更新，互不覆盖。
 */

let siteName: string | null = null
let pageTitle: string | null = null

function applyPageTitle() {
  if (typeof document === "undefined") return

  const parts = [pageTitle, siteName].filter(
    (part): part is string => Boolean(part)
  )
  if (parts.length > 0) {
    document.title = parts.join(" · ")
  }
}

/** 站点名（来自 /api/public/config）；站点名变化时保留当前页面标题 */
export function setSiteName(name: string | null) {
  siteName = name?.trim() || null
  applyPageTitle()
}

/** 当前页面标题；路由切换时更新，标题本身已由调用方本地化 */
export function setPageTitle(title: string | null) {
  pageTitle = title?.trim() || null
  applyPageTitle()
}

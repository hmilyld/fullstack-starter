// 纯 SPA：生产环境由 Nginx 提供静态文件，认证与数据都在后端 API。
// 后台系统不需要 SEO，关闭 SSR；未预渲染的路由交给 adapter-static 的 index.html fallback。
export const ssr = false
export const prerender = false

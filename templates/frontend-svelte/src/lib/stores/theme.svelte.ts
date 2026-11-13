type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_STORAGE_KEY = "theme"

function getSystemTheme(): ResolvedTheme {
  return typeof window !== "undefined" &&
    window.matchMedia(COLOR_SCHEME_QUERY).matches
    ? "dark"
    : "light"
}

function loadTheme(): Theme {
  if (typeof localStorage === "undefined") return "system"
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored
  }
  return "system"
}

let theme = $state<Theme>(loadTheme())
let systemTheme = $state<ResolvedTheme>(getSystemTheme())

function computeResolvedTheme(): ResolvedTheme {
  return theme === "system" ? systemTheme : theme
}

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
  mediaQuery.addEventListener("change", (event) => {
    systemTheme = event.matches ? "dark" : "light"
  })

  // 与 React/Vue 模板一致：其他标签页切换主题时同步当前页面
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return
    theme =
      event.newValue === "dark" ||
      event.newValue === "light" ||
      event.newValue === "system"
        ? event.newValue
        : "system"
  })
}

export function applyTheme(next: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(next)
  root.style.colorScheme = next
}

export function getTheme() {
  return theme
}

export function getResolvedTheme() {
  return computeResolvedTheme()
}

export function setTheme(nextTheme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  theme = nextTheme
}

import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"

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

/** 系统主题是模块级状态，避免每次进入页面都重复绑定监听器 */
const systemTheme = ref<ResolvedTheme>(getSystemTheme())

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
  mediaQuery.addEventListener("change", (event) => {
    systemTheme.value = event.matches ? "dark" : "light"
  })
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
  root.setAttribute("data-theme", theme)
}

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored
  }
  return "system"
}

export const useThemeStore = defineStore("theme", () => {
  const theme = ref<Theme>(loadTheme())
  const resolvedTheme = computed<ResolvedTheme>(() =>
    theme.value === "system" ? systemTheme.value : theme.value
  )

  watch(resolvedTheme, (value) => applyTheme(value), { immediate: true })

  function setTheme(nextTheme: Theme) {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    theme.value = nextTheme
  }

  function toggleTheme() {
    setTheme(resolvedTheme.value === "dark" ? "light" : "dark")
  }

  return { theme, resolvedTheme, setTheme, toggleTheme }
})

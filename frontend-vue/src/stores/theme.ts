import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'dark' | 'light' | 'system'

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.setAttribute('data-theme', resolved)
}

function loadTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored
  }
  return 'system'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(loadTheme())

  function setTheme(nextTheme: Theme) {
    localStorage.setItem('theme', nextTheme)
    theme.value = nextTheme
    applyTheme(nextTheme)
  }

  watch(theme, (val) => applyTheme(val), { immediate: true })

  if (theme.value === 'system') {
    const mql = window.matchMedia(COLOR_SCHEME_QUERY)
    mql.addEventListener('change', () => applyTheme('system'))
  }

  function toggleTheme() {
    const current = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(current)
  }

  return { theme, setTheme, toggleTheme }
})

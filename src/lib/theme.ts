import type { Theme } from '../types'

export function isDark(theme: Theme): boolean {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return theme === 'dark'
}

export function applyTheme(theme: Theme): void {
  const dark = isDark(theme)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0f172a' : '#14b8a6')
}

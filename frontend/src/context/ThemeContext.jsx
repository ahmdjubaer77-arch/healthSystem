import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'

const THEME_STORAGE_KEY = 'bdh_theme'
const ThemeContext = createContext(null)

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'

  let savedTheme
  try {
    savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    savedTheme = null
  }
  const theme = savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

  document.documentElement.dataset.theme = theme
  return theme
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Theme preference could not be saved:', error.message)
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'light' ? '#f2f8fc' : '#071c2d',
    )
  }, [theme])

  const value = useMemo(() => ({
    theme,
    isLight: theme === 'light',
    toggleTheme: () => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

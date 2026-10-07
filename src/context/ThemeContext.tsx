import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Tema = 'light' | 'dark'

interface ThemeContextValue {
  tema: Tema
  alternarTema: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const THEME_KEY = 'gerenciador-acesso-tema'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem(THEME_KEY)
    return salvo === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem(THEME_KEY, tema)
  }, [tema])

  const value = useMemo(
    () => ({ tema, alternarTema: () => setTema((atual) => (atual === 'dark' ? 'light' : 'dark')) }),
    [tema],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.')
  return context
}

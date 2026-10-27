import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from '../translations/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return window.localStorage.getItem('bdh_language') === 'bn' ? 'bn' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem('bdh_language', language)
    } catch (error) {
      console.warn('Language preference could not be saved:', error.message)
    }
  }, [language])

  const value = {
    language,
    toggleLanguage: () => setLanguage((current) => current === 'en' ? 'bn' : 'en'),
    t: (key, fallback = key) => translations[language][key] || translations.en[key] || fallback,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

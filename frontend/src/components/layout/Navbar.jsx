import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, Globe2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Brand from './Brand'
import DesktopNav from './DesktopNav'
import UserMenu from './UserMenu'
import GlobalSearch from './GlobalSearch'
import { useLanguage } from '../../context/LanguageContext'

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    let lastIsScrolled = window.scrollY > 12

    const handleScroll = () => {
      const nextIsScrolled = window.scrollY > 12
      if (nextIsScrolled === lastIsScrolled) return

      lastIsScrolled = nextIsScrolled
      setIsScrolled(nextIsScrolled)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/' || hash !== '#quick-access') return undefined

    const scrollToSearch = () => {
      document.getElementById('quick-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToSearch))
    const fallback = window.setTimeout(scrollToSearch, 160)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    }
  }, [hash, pathname])

  return (
    <header
      className={`navbar-shell sticky top-2 z-50 mx-auto w-[calc(100%-1.25rem)] max-w-[1440px] rounded-full sm:top-3 sm:w-[calc(100%-2rem)] ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <nav
        className="navbar-layout grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-6"
        aria-label="Main navigation"
      >
        <div className="navbar-leading col-start-1 row-start-1 min-w-0">
          <Brand />
        </div>
        <DesktopNav />
        <div className="navbar-profile-slot col-start-2 row-start-1 flex items-center justify-self-end gap-1.5 md:col-start-3 sm:gap-2">
          <GlobalSearch />
          <button
            type="button"
            className="language-toggle navbar-desktop-language"
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Switch language to Bangla' : 'Switch language to English'}
            lang={language === 'en' ? 'bn' : 'en'}
          >
            <Globe2 size={15} aria-hidden="true" />
            {language === 'en' ? 'EN' : 'বাং'}
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          <UserMenu
            user={isAuthenticated ? user : null}
            onLogout={logout}
            language={language}
            onToggleLanguage={toggleLanguage}
          />
        </div>
      </nav>
    </header>
  )
}

export default Navbar

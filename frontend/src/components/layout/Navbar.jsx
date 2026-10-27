import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Brand from './Brand'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import UserMenu from './UserMenu'
import { useLanguage } from '../../context/LanguageContext'

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { language, toggleLanguage } = useLanguage()

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

  return (
    <header
      className={`navbar-shell sticky top-2 z-50 mx-auto w-[calc(100%-1.25rem)] max-w-[1440px] rounded-full sm:top-3 sm:w-[calc(100%-2rem)] ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <nav
        className="navbar-layout grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 lg:px-6 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
        aria-label="Main navigation"
      >
        <div className="navbar-leading col-start-1 row-start-1 min-w-0">
          <Brand />
        </div>
        <DesktopNav />
        <MobileNav
          className="col-start-2 row-start-1 justify-self-end xl:hidden"
          isOpen={mobileOpen}
          onToggle={() => setMobileOpen((value) => !value)}
          isLoggedIn={isAuthenticated}
          user={user}
          onLogout={logout}
        />
        <div className="navbar-profile-slot col-start-3 row-start-1 flex items-center justify-self-end gap-2">
          <button
            type="button"
            className="language-toggle"
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Switch language to Bangla' : 'Switch language to English'}
            lang={language === 'en' ? 'bn' : 'en'}
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>
          <UserMenu user={user} onLogout={logout} />
        </div>
      </nav>
    </header>
  )
}

export default Navbar

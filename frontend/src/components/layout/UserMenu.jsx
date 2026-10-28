import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Globe2,
  Grid2X2,
  HeartPulse,
  LogIn,
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { authActions, navItems } from '../../config/navigation'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import ProfileAvatar from '../common/ProfileAvatar'
import ThemeToggle from './ThemeToggle'

function UserMenu({ user, onLogout, language, onToggleLanguage }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { pathname } = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches,
  )
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const closeRef = useRef(null)
  const menuItems = [
    { translationKey: 'profile', path: '/profile', icon: UserRound },
    { translationKey: 'myHealth', path: '/health', icon: HeartPulse },
    { translationKey: 'medicalRecords', path: '/health', icon: FileText },
    { translationKey: 'settings', path: '/settings', icon: Settings },
    { translationKey: 'privacy', path: '/privacy', icon: ShieldCheck },
  ]
  const primaryItems = navItems.filter((item) => ['/', '/health', '/emergency'].includes(item.path))
  const serviceItems = navItems.filter((item) => !primaryItems.includes(item))

  const closeMenu = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    setOpen(false)
    setServicesOpen(false)
  }, [pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1279px)')
    const updateBreakpoint = (event) => setIsMobile(event.matches)
    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateBreakpoint)
    return () => mediaQuery.removeEventListener('change', updateBreakpoint)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('mobile-account-menu-open')
    }
    if (isMobile) {
      closeRef.current?.focus()
    } else {
      menuRef.current?.querySelector('a[href], button:not([disabled])')?.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      const dialog = document.getElementById('navbar-account-menu')
      if (event.key !== 'Tab' || !isMobile || !dialog) return
      const focusableElements = dialog.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (!firstElement || !lastElement) return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.classList.remove('mobile-account-menu-open')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isMobile])

  return (
    <div ref={menuRef} className={`navbar-account-menu-anchor relative ${open ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t('closeMenu', 'Close menu') : t('openAccountMenu', 'Open account menu')}
        aria-expanded={open}
        aria-controls="navbar-account-menu"
        aria-haspopup="dialog"
        className="navbar-profile-button inline-flex h-11 w-11 items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 text-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        {user ? (
          <ProfileAvatar user={user} size="sm" />
        ) : (
          <UserRound size={20} aria-hidden="true" />
        )}
        <ChevronDown
          size={13}
          className={`navbar-profile-chevron hidden shrink-0 transition-transform sm:block${open ? ' rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t('closeMenu', 'Close menu')}
              className="mobile-account-menu-backdrop fixed inset-0 z-40 xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
              onClick={closeMenu}
              tabIndex={-1}
            />
            <motion.div
              id="navbar-account-menu"
              role="dialog"
              aria-modal={isMobile}
              aria-label={t('account')}
              initial={shouldReduceMotion ? false : isMobile ? { opacity: 0, x: '100%' } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : isMobile ? { opacity: 0, x: '100%' } : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className={`navbar-account-menu ${isMobile ? 'mobile-account-panel' : 'nav-dropdown'} absolute right-0 top-[calc(100%+0.65rem)] z-[100] rounded-[20px] p-2.5 mobile-theme-${theme}${user ? ' is-authenticated' : ' is-guest'}`}
            >
              <div className="mobile-account-header xl:hidden">
                <div className="mobile-account-brand">
                  <span className="mobile-account-brand-mark">
                    <HeartPulse size={19} aria-hidden="true" />
                  </span>
                  <span className="mobile-account-brand-copy">
                    <strong>Nirogix <span className="navbar-wordmark-x">X</span></strong>
                    <small>{t('brandTagline', 'Your Health, Connected.')}</small>
                  </span>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={closeMenu}
                  className="mobile-account-close"
                  aria-label={t('closeMenu', 'Close menu')}
                >
                  <X size={18} aria-hidden="true" />
                </button>
                <div className="mobile-account-identity">
                  {user ? (
                    <ProfileAvatar user={user} size="md" className="mobile-account-avatar" />
                  ) : (
                    <span className="mobile-account-guest-avatar">
                      <UserRound size={25} aria-hidden="true" />
                    </span>
                  )}
                  <div className="mobile-account-identity-copy">
                    <span className="mobile-account-eyebrow">{user ? t('account') : t('guest', 'GUEST')}</span>
                    <strong>{user ? (user.name || user.email) : t('notLoggedIn', 'Not logged in')}</strong>
                    <small>
                      {user?.email || t('guestMenuHint', 'Sign in to access more features')}
                    </small>
                  </div>
                </div>
              </div>

              <div className="mobile-account-navigation xl:hidden">
                <nav aria-label={t('navigation')}>
                  {primaryItems.filter((item) => item.path !== '/emergency').map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={({ isActive }) => `mobile-account-link${isActive ? ' is-active' : ''}`}
                    >
                      <item.icon size={19} aria-hidden="true" />
                      <span>{t(item.translationKey)}</span>
                      <ChevronRight size={17} aria-hidden="true" />
                    </NavLink>
                  ))}
                  <div className={`mobile-account-services${servicesOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className={`mobile-account-link mobile-account-services-toggle${servicesOpen ? ' is-active' : ''}`}
                      aria-expanded={servicesOpen}
                      aria-controls="mobile-account-service-links"
                      onClick={() => setServicesOpen((value) => !value)}
                    >
                      <Grid2X2 size={19} aria-hidden="true" />
                      <span>{t('services', 'Services')}</span>
                      <ChevronDown
                        size={17}
                        className={`mobile-account-services-chevron${servicesOpen ? ' is-expanded' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {servicesOpen && (
                      <nav id="mobile-account-service-links" className="mobile-account-service-links" aria-label={t('services', 'Services')}>
                        {serviceItems.map((item) => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeMenu}
                            className={({ isActive }) => `mobile-account-service-link${isActive ? ' is-active' : ''}`}
                          >
                            <item.icon size={17} aria-hidden="true" />
                            <span>{t(item.translationKey)}</span>
                            <ChevronRight size={15} aria-hidden="true" />
                          </NavLink>
                        ))}
                      </nav>
                    )}
                  </div>
                  {primaryItems.filter((item) => item.path === '/emergency').map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={({ isActive }) => `mobile-account-link is-emergency${isActive ? ' is-active' : ''}`}
                    >
                      <item.icon size={19} aria-hidden="true" />
                      <span>{t(item.translationKey)}</span>
                      <ChevronRight size={17} aria-hidden="true" />
                    </NavLink>
                  ))}
                </nav>

                <div className="mobile-account-divider" />
                <div className="mobile-account-secondary">
                  {(user ? menuItems : menuItems.filter((item) => ['settings', 'privacy'].includes(item.translationKey))).map((item) => (
                    <Link
                      key={`${item.translationKey}-${item.path}`}
                      to={item.path}
                      onClick={closeMenu}
                      className="mobile-account-link"
                    >
                      <item.icon size={19} aria-hidden="true" />
                      <span>{t(item.translationKey)}</span>
                      <ChevronRight size={17} aria-hidden="true" />
                    </Link>
                  ))}
                  <div className="mobile-account-link mobile-account-theme-row">
                    <Palette size={19} aria-hidden="true" />
                    <span>{t('theme', 'Theme')}</span>
                    <ChevronRight size={17} aria-hidden="true" />
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout?.()
                        closeMenu()
                      }}
                      className="mobile-account-link navbar-account-logout"
                    >
                      <LogOut size={19} aria-hidden="true" />
                      <span>{t('logout')}</span>
                    </button>
                  ) : (
                    <Link
                      to={authActions[0].path}
                      onClick={closeMenu}
                      className="mobile-account-link navbar-account-login"
                    >
                      <LogIn size={19} aria-hidden="true" />
                      <span>{t(authActions[0].translationKey)}</span>
                      <ChevronRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="desktop-account-menu hidden xl:block">
                {user ? (
                  <>
                    <div className="navbar-account-header">
                      <p className="navbar-account-heading">{t('account')}</p>
                      <p className="navbar-account-email">{user.email || t('emailUnavailable')}</p>
                    </div>
                    <div className="navbar-account-links">
                      {menuItems.map((item) => (
                        <Link key={`${item.translationKey}-${item.path}`} to={item.path} onClick={closeMenu} className="navbar-account-link">
                          <item.icon size={16} aria-hidden="true" />
                          {t(item.translationKey)}
                        </Link>
                      ))}
                    </div>
                    <button type="button" onClick={() => { onLogout?.(); closeMenu() }} className="navbar-account-link navbar-account-logout">
                      <LogOut size={16} aria-hidden="true" />
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <div className="navbar-account-auth-links">
                    {authActions.map((action, index) => (
                      <Link key={action.path} to={action.path} onClick={closeMenu} className={`navbar-account-link${index === 0 ? ' navbar-account-login' : ''}`}>
                        {index === 0 ? <LogIn size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                        {t(action.translationKey)}
                      </Link>
                    ))}
                    <div className="navbar-account-theme-toggle flex justify-end border-t border-white/10 pt-2">
                      <ThemeToggle />
                    </div>
                  </div>
                )}
              </div>

              <div className="mobile-account-language xl:hidden">
                <span><Globe2 size={16} aria-hidden="true" />{t('language')}</span>
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  aria-label={language === 'en' ? 'Switch language to Bangla' : 'Switch language to English'}
                  lang={language === 'en' ? 'bn' : 'en'}
                >
                  {language === 'en' ? 'বাংলা' : 'English'}
                </button>
              </div>
              {user && (
                <div className="navbar-account-theme-toggle mt-2 hidden justify-end border-t border-white/10 pt-2 xl:flex">
                  <ThemeToggle />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserMenu

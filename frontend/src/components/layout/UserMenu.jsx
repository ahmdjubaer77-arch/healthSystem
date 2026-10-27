import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FileText, HeartPulse, LogIn, LogOut, Settings, ShieldCheck, UserRound, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { authActions } from '../../config/navigation'
import { useLanguage } from '../../context/LanguageContext'
import ProfileAvatar from '../common/ProfileAvatar'
import ThemeToggle from './ThemeToggle'

function UserMenu({ user, onLogout }) {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const menuItems = [
    { translationKey: 'profile', path: '/profile', icon: UserRound },
    { translationKey: 'myHealth', path: '/health', icon: HeartPulse },
    { translationKey: 'medicalRecords', path: '/health', icon: FileText },
    { translationKey: 'settings', path: '/settings', icon: Settings },
    { translationKey: 'privacy', path: '/profile', icon: ShieldCheck },
  ]

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={menuRef} className={`navbar-account-menu-anchor relative ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close account menu' : 'Open account menu'}
        aria-expanded={open}
        aria-controls="navbar-account-menu"
        aria-haspopup="true"
        className="navbar-profile-button inline-flex h-11 w-11 items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 text-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        {user ? (
          <ProfileAvatar user={user} size="sm" />
        ) : (
          <UserRound size={20} aria-hidden="true" />
        )}
        <ChevronDown size={13} className="hidden shrink-0 sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div
          id="navbar-account-menu"
          className="navbar-account-menu nav-dropdown absolute right-0 top-[calc(100%+0.65rem)] z-[100] rounded-[20px] p-2.5"
          aria-label={t('account')}
        >
          {user ? (
            <>
              <div className="navbar-account-header">
                <p className="navbar-account-heading">{t('account')}</p>
                <p className="navbar-account-email">{user.email || t('emailUnavailable')}</p>
              </div>
              <div className="navbar-account-links">
                {menuItems.map((item) => (
                  <Link
                    key={`${item.translationKey}-${item.path}`}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className="navbar-account-link"
                  >
                    <item.icon size={16} aria-hidden="true" />
                    {t(item.translationKey)}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout?.()
                  setOpen(false)
                }}
                className="navbar-account-link navbar-account-logout"
              >
                <LogOut size={16} aria-hidden="true" />
                {t('logout')}
              </button>
            </>
          ) : (
            <div className="navbar-account-links">
              <Link
                to={authActions[0].path}
                onClick={() => setOpen(false)}
                className="navbar-account-link"
              >
                <LogIn size={16} aria-hidden="true" />
                {t(authActions[0].translationKey)}
              </Link>
              <Link
                to={authActions[1].path}
                onClick={() => setOpen(false)}
                className="navbar-account-link"
              >
                <UserPlus size={16} aria-hidden="true" />
                {t(authActions[1].translationKey)}
              </Link>
            </div>
          )}
          <div className="navbar-account-theme-toggle mt-2 hidden justify-end border-t border-white/10 pt-2 xl:flex">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu

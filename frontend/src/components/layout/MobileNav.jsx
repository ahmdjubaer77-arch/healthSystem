import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import { LogIn, LogOut, Menu, UserPlus, X } from 'lucide-react'
import { mobileNavItems } from '../../config/navigation'
import { useLanguage } from '../../context/LanguageContext'
import ProfileAvatar from '../common/ProfileAvatar'
import ThemeToggle from './ThemeToggle'

function MobileNav({ isOpen, onToggle, isLoggedIn = false, user, onLogout, className = '' }) {
  const { t } = useLanguage()
  return (
    <div className={`mobile-nav-shell flex items-center gap-2 xl:hidden ${className}`.trim()}>
      <button
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={onToggle}
        className="navbar-icon-button flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
              onClick={onToggle}
            />

            <motion.div
              id="mobile-navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="mobile-menu-panel fixed right-3 top-[76px] z-50 w-[88vw] max-w-sm rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-[0_20px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-end border-b border-white/10 pb-3">
                  <ThemeToggle />
                </div>
                {mobileNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onToggle}
                    className={({ isActive }) =>
                      `mobile-menu-link rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? item.highlight
                            ? 'border border-red-300/35 bg-red-500/15 text-red-50'
                            : 'bg-cyan-400/15 text-white'
                          : 'text-slate-200 hover:bg-white/5'
                      }`
                    }
                  >
                    {t(item.translationKey)}
                  </NavLink>
                ))}

                {isLoggedIn ? (
                  <div className="mt-2 grid gap-2">
                    <Link to="/profile" onClick={onToggle} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100">
                      <ProfileAvatar user={user} size="sm" />
                      {user?.name || t('profile')}
                    </Link>
                    <Link to="/settings" onClick={onToggle} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100">{t('settings')}</Link>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout?.();
                        onToggle();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/35 bg-red-500/15 px-3 py-2.5 text-sm font-medium text-red-100"
                    >
                      <LogOut size={14} />
                      {t('logout')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={onToggle}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-100"
                    >
                      <LogIn size={14} />
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={onToggle}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/35 bg-cyan-400/15 px-3 py-2.5 text-sm font-medium text-cyan-100"
                    >
                      <UserPlus size={14} />
                      {t('signUp')}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileNav

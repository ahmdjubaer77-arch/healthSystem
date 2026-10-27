import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, ShieldCheck, X } from 'lucide-react'
import { adminNavigation } from '../../config/adminNavigation'
import { adminNavigationPermissions } from '../../config/adminPermissions'
import { useAdminPermissions } from '../../context/AdminPermissionContext'
import { useAuth } from '../../context/AuthContext'

function AdminMobileSidebar({ isOpen, onClose }) {
  const closeButtonRef = useRef(null)
  const { logout } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const visibleNavigation = adminNavigation.filter((item) => {
    const requiredPermission = adminNavigationPermissions[item.path]
    return !requiredPermission || hasPermission(requiredPermission)
  })

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="admin-mobile-overlay fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close admin navigation"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        id="admin-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className="admin-mobile-drawer relative flex h-full w-[min(88vw,20rem)] flex-col border-r border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin Panel</p>
              <p className="text-xs text-slate-400">Platform control center</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            autoFocus
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Mobile admin navigation">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) => `admin-sidebar-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border border-cyan-300/25 bg-cyan-400/12 text-cyan-50'
                  : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={17} className="text-cyan-200/80" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            logout()
            onClose()
          }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300 transition hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-100"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
    </div>
  )
}

export default AdminMobileSidebar

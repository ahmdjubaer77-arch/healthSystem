import { NavLink } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import { adminNavigation } from '../../config/adminNavigation'
import { adminNavigationPermissions } from '../../config/adminPermissions'
import { useAdminPermissions } from '../../context/AdminPermissionContext'
import { useAuth } from '../../context/AuthContext'

function AdminSidebar() {
  const { logout } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const visibleNavigation = adminNavigation.filter((item) => {
    const requiredPermission = adminNavigationPermissions[item.path]
    return !requiredPermission || hasPermission(requiredPermission)
  })

  return (
    <aside className="admin-desktop-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-slate-950/80 px-4 py-5 backdrop-blur-2xl lg:flex">
      <div className="flex min-h-12 items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-100">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Admin Panel</p>
          <p className="text-xs text-slate-400">Platform control center</p>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Admin navigation">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `admin-sidebar-link group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              isActive
                ? 'border border-cyan-300/25 bg-cyan-400/12 text-cyan-50 shadow-[0_8px_24px_rgba(34,211,238,0.10)]'
                : 'border border-transparent text-slate-300 hover:border-white/5 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={17} className="shrink-0 text-cyan-200/80" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300 transition hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-100"
      >
        <LogOut size={17} />
        Sign out
      </button>
    </aside>
  )
}

export default AdminSidebar

import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ProfileAvatar from '../common/ProfileAvatar'

function AdminHeader({ onOpenMobileSidebar }) {
  const { user } = useAuth()

  return (
    <header className="admin-topbar sticky top-3 z-30 mx-3 mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-lg shadow-slate-950/10 backdrop-blur-xl sm:mx-4 sm:px-6 lg:mx-6 lg:px-8">
      <div className="flex min-h-10 items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-controls="admin-mobile-navigation"
            aria-haspopup="dialog"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10 lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={19} />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Administration</p>
            <p className="mt-0.5 text-sm text-slate-300">Platform operations</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
            <ProfileAvatar user={user} size="sm" />
            <div className="hidden min-w-0 max-w-40 pr-1 sm:block">
              <p className="truncate text-xs font-medium text-white">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader

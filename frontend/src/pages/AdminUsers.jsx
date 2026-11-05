import { useEffect, useState } from 'react'
import { Activity, BadgeCheck, Ban, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Filter, Mail, MapPin, Phone, Search, Trash2, UserRound, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminUsers, getAdminUser, updateAdminUserStatus, updateAdminUserRole, deleteAdminUser } from '../services/api'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import ProfileAvatar from '../components/common/ProfileAvatar'
import ThemedSelect from '../components/common/ThemedSelect'
import ConfirmModal from '../components/common/ConfirmModal'
import Button from '../components/common/Button'

const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'BLOOD_DONOR', 'AMBULANCE_PROVIDER', 'ADMIN', 'SUPER_ADMIN']
const STATUSES = ['ACTIVE', 'SUSPENDED']

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function UserDetails({ user, onClose, roleOptions, canDelete, onStatusChange, onDelete, onRoleChange }) {
  if (!user) return null
  const location = user.location ? [user.location.division, user.location.district, user.location.upazila].filter(Boolean).join(', ') : 'Not provided'
  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null
  const lastLoginDate = lastLogin && !Number.isNaN(lastLogin.getTime()) ? formatDate(user.lastLoginAt) : 'Not available'
  const lastLoginTime = lastLogin && !Number.isNaN(lastLogin.getTime())
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(lastLogin)
    : ''
  const canChangeRole = user.role !== 'SUPER_ADMIN' && roleOptions.length > 0

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-2.5 backdrop-blur-sm sm:p-5" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-preview-title"
        className="relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-[20px] border border-teal-400/50 bg-[#07110f] p-3 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:rounded-[30px] sm:p-6 md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-400/40 bg-teal-400/10 text-teal-200 sm:h-14 sm:w-14">
              <UserRound size={20} className="sm:h-6 sm:w-6" />
            </span>
            <span className="h-8 w-1 shrink-0 rounded-full bg-teal-300 sm:h-10" />
            <div className="min-w-0">
              <h2 id="admin-user-preview-title" className="text-base font-bold text-white sm:text-2xl">Account Details</h2>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-400 sm:text-sm sm:leading-normal">Complete information about this user</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close account details" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-teal-300/50 hover:bg-white/5 hover:text-white sm:h-10 sm:w-10">
            <X size={17} className="sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5 sm:mt-8 sm:gap-5 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal-400/60 bg-gradient-to-br from-teal-400/25 to-emerald-500/5 text-teal-100 shadow-[inset_0_0_18px_rgba(20,184,166,0.12)] sm:h-28 sm:w-28 sm:rounded-[28px]">
            {user.profilePicture?.url
              ? <img src={user.profilePicture.url} alt={`${user.name}'s profile`} className="h-full w-full object-cover" />
              : <UserRound size={32} strokeWidth={1.5} className="sm:h-14 sm:w-14" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="min-w-0 break-words text-lg font-bold leading-tight text-white sm:text-3xl">{user.name}</h3>
              {user.emailVerified && <BadgeCheck size={18} className="shrink-0 fill-teal-300 text-[#07110f] sm:h-6 sm:w-6" aria-label="Email verified" />}
            </div>
            <p className="mt-1 flex min-w-0 items-start gap-1.5 break-all text-xs leading-4 text-slate-300 sm:items-center sm:gap-2 sm:text-base sm:leading-normal">
              <Mail size={14} className="mt-0.5 shrink-0 text-slate-400 sm:mt-0 sm:h-[17px] sm:w-[17px]" />{user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/20 bg-teal-100/[0.08] px-2 py-1 text-[10px] font-medium text-teal-100 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                <UserRound size={12} className="sm:h-[15px] sm:w-[15px]" />{user.role}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${user.accountStatus === 'ACTIVE' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-red-400/40 bg-red-500/10 text-red-300'}`}>
                <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${user.accountStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {user.accountStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3">
          <PreviewDetail icon={Phone} label="Phone" value={user.phone || 'Not provided'} className="col-span-2" />
          <PreviewDetail icon={MapPin} label="Location" value={location} className="col-span-2" />
          <PreviewDetail icon={Mail} label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} verified={user.emailVerified} />
          <PreviewDetail icon={Phone} label="Phone verified" value={user.phoneVerified ? 'Yes' : 'No'} verified={user.phoneVerified} />
          <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl border border-teal-100/10 bg-white/[0.035] p-2.5 sm:gap-3 sm:rounded-2xl sm:p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/[0.08] text-teal-200 sm:h-11 sm:w-11 sm:rounded-xl"><CalendarDays size={18} className="sm:h-[22px] sm:w-[22px]" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.16em]">Last login</p>
              <p className="mt-0.5 break-words text-xs font-semibold text-white sm:mt-1 sm:text-base">{lastLoginDate}</p>
            </div>
            {lastLoginTime && <span className="flex shrink-0 items-center gap-1.5 border-l border-white/10 pl-2 text-[10px] text-slate-300 sm:gap-2 sm:pl-5 sm:text-sm"><Clock3 size={14} className="text-teal-200 sm:h-[17px] sm:w-[17px]" />{lastLoginTime}</span>}
          </div>
          <p className="col-span-2 text-[10px] leading-4 text-slate-500 sm:text-xs sm:leading-normal">Joined {formatDate(user.createdAt)} · Health records and medical documents are protected.</p>
        </div>

        <div className={`mt-3 grid grid-cols-2 gap-2 border-t border-teal-100/20 pt-3 sm:mt-6 sm:gap-3 sm:pt-5 ${canDelete && canChangeRole ? 'sm:grid-cols-3' : canDelete || canChangeRole ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
          {canChangeRole && (
            <ThemedSelect
              aria-label={`Change role for ${user.name}`}
              value=""
              className="col-span-2 !h-10 !rounded-lg !px-2.5 !py-1 !text-xs sm:col-span-1 sm:!h-11 sm:!rounded-xl sm:!px-3 sm:!py-2.5 sm:!text-sm"
              onChange={(event) => {
                if (!event.target.value) return
                onRoleChange(user, event.target.value)
                onClose()
              }}
            >
              <option value="">Change role</option>
              {roleOptions.filter((role) => role !== user.role).map((role) => <option key={role} value={role}>{role}</option>)}
            </ThemedSelect>
          )}
          <button
            type="button"
            onClick={() => {
              onStatusChange(user)
              onClose()
            }}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-teal-200/50 px-2 py-1.5 text-[11px] font-semibold text-teal-100 transition hover:bg-teal-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
          >
            <Ban size={14} className="sm:h-[17px] sm:w-[17px]" />{user.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(user)
                onClose()
              }}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-400/60 bg-red-500/[0.08] px-2 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            >
              <Trash2 size={14} className="sm:h-[17px] sm:w-[17px]" />Delete
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function PreviewDetail({ icon: Icon, label, value, verified, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-xl border border-teal-100/10 bg-white/[0.035] p-2.5 sm:gap-3 sm:rounded-2xl sm:p-4 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/[0.08] text-teal-200 sm:h-11 sm:w-11 sm:rounded-xl"><Icon size={17} className="sm:h-[22px] sm:w-[22px]" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-medium uppercase tracking-[0.06em] text-slate-400 sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
        {typeof verified === 'boolean' ? (
          <p className={`mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none sm:px-2 sm:py-1 sm:text-xs ${verified ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-red-400/40 bg-red-500/10 text-red-300'}`}>
            {verified ? <Check size={10} className="sm:h-[13px] sm:w-[13px]" /> : <X size={10} className="sm:h-[13px] sm:w-[13px]" />}{verified ? 'Yes' : 'No'}
          </p>
        ) : (
          <p className="mt-0.5 break-words text-[11px] font-semibold leading-4 text-white sm:mt-1 sm:text-base sm:leading-normal">{value}</p>
        )}
      </div>
    </div>
  )
}

function AdminUsers() {
  const { accessToken, user } = useAuth()
  const currentUserId = user?.id
  const { hasPermission } = useAdminPermissions()
  const roleOptions = user?.role === 'SUPER_ADMIN' ? ROLES : ROLES.filter((role) => role !== 'SUPER_ADMIN')
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailsUser, setDetailsUser] = useState(null)
  const [action, setAction] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [filters, setFilters] = useState({ search: '', role: '', status: '', location: '', createdFrom: '', createdTo: '' })

  const loadUsers = async (page = pagination.page) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminUsers(accessToken, { ...filters, page, limit: 20 })
      setUsers(result.users)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers(1) }, [])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const submitStatusChange = async () => {
    if (!action) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminUserStatus(accessToken, action.id, action.status)
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))
      setAction(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitRoleChange = async () => {
    if (!action) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminUserRole(accessToken, action.id, action.role)
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))
      setAction(null)
      setDetailsUser(updated)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitUserDelete = async () => {
    if (!action || action.type !== 'delete' || deletingUser) return
    setDeletingUser(true)
    setError('')
    try {
      await deleteAdminUser(accessToken, action.id)
      const nextPage = users.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page
      setAction(null)
      setDetailsUser(null)
      await loadUsers(nextPage)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingUser(false)
    }
  }

  const openStatusAction = (user) => setAction({ id: user.id, type: 'status', status: user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', user })
  const openDeleteAction = (targetUser) => setAction({ id: targetUser.id, type: 'delete', user: targetUser })

  const openDetails = async (user) => {
    setLoading(true)
    setError('')
    try {
      setDetailsUser(await getAdminUser(accessToken, user.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="User management" description="Search, review, suspend, and assign roles to platform accounts. Health records remain protected." />
      <GlassCard className="mt-4 p-3 sm:mt-5 sm:p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200"><Filter size={14} className="text-cyan-300" /> Filters</div>
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-4">
          <label className="relative col-span-2 xl:col-span-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadUsers(1)} placeholder="Search name, email, phone" className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-300/30 sm:text-sm" /></label>
          <ThemedSelect value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className="!h-10 w-full min-w-0 !rounded-lg !px-2.5 !py-1 !text-xs sm:!px-3 sm:!text-sm"><option value="">All roles</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</ThemedSelect>
          <ThemedSelect value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="!h-10 w-full min-w-0 !rounded-lg !px-2.5 !py-1 !text-xs sm:!px-3 sm:!text-sm"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</ThemedSelect>
          <label className="relative col-span-2 xl:col-span-1"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /><input value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} placeholder="Division, district, area" className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-300/30 sm:text-sm" /></label>
          <label className="min-w-0 text-[10px] text-slate-400 sm:text-xs">Joined from<input type="date" value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-white/10 bg-slate-900/80 px-2 text-xs text-white outline-none sm:px-3 sm:text-sm" /></label>
          <label className="min-w-0 text-[10px] text-slate-400 sm:text-xs">Joined to<input type="date" value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-white/10 bg-slate-900/80 px-2 text-xs text-white outline-none sm:px-3 sm:text-sm" /></label>
          <div className="col-span-2 flex gap-2 xl:col-span-2"><Button onClick={() => loadUsers(1)} className="!min-h-10 flex-1 !rounded-lg !px-3 !py-2 !text-xs sm:!text-sm">Apply filters</Button><Button variant="secondary" onClick={() => { setFilters({ search: '', role: '', status: '', location: '', createdFrom: '', createdTo: '' }); setTimeout(() => loadUsers(1), 0) }} className="!min-h-10 !rounded-lg !px-3 !py-2 !text-xs sm:!text-sm">Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadUsers(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading users" className="mt-6" />}
      {!loading && !error && users.length === 0 && <div className="mt-6"><EmptyState icon={Users} title="No users found" message="Try changing the filters or check the database connection." /></div>}
      {!loading && !error && users.length > 0 && (
        <GlassCard className="mt-5 overflow-hidden sm:mt-6">
          <div className="space-y-3 p-3 md:hidden">
            {users.map((user) => (
              <article key={user.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <ProfileAvatar user={user} size="md" className="h-10 w-10" />
                  <button type="button" onClick={() => openDetails(user)} className="min-w-0 flex-1 text-left">
                    <span className="block break-words font-medium text-white">{user.name}</span>
                    <span className="mt-0.5 block break-all text-xs text-slate-400">{user.email}</span>
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.08] pt-3 text-xs">
                  <div className="min-w-0"><dt className="text-slate-500">Role</dt><dd className="mt-1 break-words text-slate-200">{user.role}</dd></div>
                  <div><dt className="text-slate-500">Status</dt><dd className="mt-1"><StatusBadge status={user.accountStatus} /></dd></div>
                  <div className="min-w-0"><dt className="text-slate-500">Location</dt><dd className="mt-1 break-words text-slate-300">{user.location ? [user.location.division, user.location.district].filter(Boolean).join(' / ') : '—'}</dd></div>
                  <div><dt className="text-slate-500">Joined</dt><dd className="mt-1 text-slate-300">{formatDate(user.createdAt)}</dd></div>
                </dl>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-white/[0.08] pt-2.5">
                  <Button size="sm" variant="secondary" onClick={() => openDetails(user)} className="!min-h-9 w-full !gap-1 !rounded-lg !px-2 !py-1 !text-xs">Details</Button>
                  <Button size="sm" variant={user.accountStatus === 'ACTIVE' ? 'emergency' : 'primary'} onClick={() => openStatusAction(user)} className="!min-h-9 w-full !gap-1 !rounded-lg !px-2 !py-1 !text-xs">{user.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}</Button>
                  {user.role !== 'SUPER_ADMIN' && <ThemedSelect value="" aria-label={`Change role for ${user.name}`} className="!h-9 !px-2 !py-1 !text-xs" onChange={(event) => { if (event.target.value) setAction({ id: user.id, type: 'role', role: event.target.value, user }) }}><option value="">Change role</option>{roleOptions.filter((role) => role !== user.role).map((role) => <option key={role} value={role}>{role}</option>)}</ThemedSelect>}
                  {hasPermission('users.delete') && user.id !== currentUserId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role) && <button type="button" onClick={() => openDeleteAction(user)} className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-red-300/25 bg-red-500/10 px-2 text-xs font-medium text-red-100 transition hover:bg-red-500/20"><Trash2 size={12} />Delete</button>}
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Actions</th></tr></thead>
              <tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(user)} className="flex items-center gap-3 text-left"><ProfileAvatar user={user} size="sm" /><span><span className="block font-medium text-white">{user.name}</span><span className="block text-xs text-slate-500">{user.email}</span></span></button></td><td className="px-5 py-4"><span className="text-slate-300">{user.role}</span></td><td className="px-5 py-4"><StatusBadge status={user.accountStatus} /></td><td className="px-5 py-4 text-slate-400">{user.location ? [user.location.division, user.location.district].filter(Boolean).join(' / ') : '—'}</td><td className="px-5 py-4 text-slate-400">{formatDate(user.createdAt)}</td><td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="secondary" onClick={() => openDetails(user)}>Details</Button><Button size="sm" variant={user.accountStatus === 'ACTIVE' ? 'emergency' : 'primary'} onClick={() => openStatusAction(user)}>{user.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}</Button>{user.role !== 'SUPER_ADMIN' && <div className="w-36"><ThemedSelect value="" aria-label={`Change role for ${user.name}`} className="!h-9 !px-2 !py-1 !text-xs" onChange={(event) => { if (event.target.value) setAction({ id: user.id, type: 'role', role: event.target.value, user }) }}><option value="">Change role</option>{roleOptions.filter((role) => role !== user.role).map((role) => <option key={role} value={role}>{role}</option>)}</ThemedSelect></div>}{hasPermission('users.delete') && user.id !== currentUserId && !['ADMIN', 'SUPER_ADMIN'].includes(user.role) && <button type="button" onClick={() => openDeleteAction(user)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-300/25 bg-red-500/10 px-3 text-xs font-medium text-red-100 transition hover:bg-red-500/20"><Trash2 size={13} />Delete</button>}</div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-center text-xs text-slate-500 sm:text-left">{pagination.total} accounts</p><div className="flex items-center justify-between gap-2 sm:justify-end"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadUsers(pagination.page - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-white/10 px-3 text-xs text-slate-200 disabled:opacity-40 sm:px-4"><ChevronLeft size={16} />Previous</button><span className="whitespace-nowrap text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadUsers(pagination.page + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-white/10 px-3 text-xs text-slate-200 disabled:opacity-40 sm:px-4">Next<ChevronRight size={16} /></button></div></div>
        </GlassCard>
      )}

      {detailsUser && (
        <UserDetails
          user={detailsUser}
          roleOptions={roleOptions}
          canDelete={hasPermission('users.delete') && detailsUser.id !== currentUserId && !['ADMIN', 'SUPER_ADMIN'].includes(detailsUser.role)}
          onClose={() => setDetailsUser(null)}
          onStatusChange={openStatusAction}
          onDelete={openDeleteAction}
          onRoleChange={(targetUser, role) => setAction({ id: targetUser.id, type: 'role', role, user: targetUser })}
        />
      )}
      <ConfirmModal open={Boolean(action)} onClose={() => { if (!deletingUser) setAction(null) }} onConfirm={action?.type === 'status' ? submitStatusChange : action?.type === 'delete' ? submitUserDelete : submitRoleChange} title={action?.type === 'status' ? `${action.status === 'SUSPENDED' ? 'Suspend' : 'Activate'} account?` : action?.type === 'delete' ? 'Permanently delete this user?' : 'Change user role?'} description={action?.type === 'status' ? `This will ${action.status === 'SUSPENDED' ? 'suspend' : 'activate'} ${action.user?.name}. This action will be audited.` : action?.type === 'delete' ? `This permanently deletes ${action.user?.name}'s account, health records, documents, and their requests. This cannot be undone. Administrator accounts are protected.` : `Change ${action?.user?.name} from ${action?.user?.role} to ${action?.role}. The backend will enforce role permissions.`} confirmText={action?.type === 'status' ? 'Confirm status change' : action?.type === 'delete' ? (deletingUser ? 'Deleting…' : 'Delete user permanently') : 'Save role'} busy={deletingUser} />
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Activity size={14} /> Every sensitive action is recorded in the administrator audit log.</div>
    </AdminPageContainer>
  )
}

export default AdminUsers

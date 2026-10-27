import { useEffect, useState } from 'react'
import { Activity, ChevronLeft, ChevronRight, Filter, MapPin, Search, UserRound, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminUsers, getAdminUser, updateAdminUserStatus, updateAdminUserRole } from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import ConfirmModal from '../components/common/ConfirmModal'
import Button from '../components/common/Button'

const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'BLOOD_DONOR', 'AMBULANCE_PROVIDER', 'ADMIN', 'SUPER_ADMIN']
const STATUSES = ['ACTIVE', 'SUSPENDED']

function formatDate(value) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

function UserDetails({ user, onClose }) {
  if (!user) return null
  const location = user.location ? [user.location.division, user.location.district, user.location.upazila].filter(Boolean).join(', ') : 'Not provided'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="max-h-[90vh] w-full max-w-xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Account details</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{user.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5">Close</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Role" value={user.role} />
          <Detail label="Status" value={user.accountStatus} />
          <Detail label="Phone" value={user.phone || 'Not provided'} />
          <Detail label="Location" value={location} />
          <Detail label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} />
          <Detail label="Phone verified" value={user.phoneVerified ? 'Yes' : 'No'} />
          <Detail label="Last login" value={formatDate(user.lastLoginAt)} />
          <Detail label="Created" value={formatDate(user.createdAt)} />
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Health records and medical documents are intentionally excluded from this administrative view.</p>
      </GlassCard>
    </div>
  )
}

function Detail({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-all text-sm text-slate-200">{value}</p></div>
}

function AdminUsers() {
  const { accessToken, user } = useAuth()
  const roleOptions = user?.role === 'SUPER_ADMIN' ? ROLES : ROLES.filter((role) => role !== 'SUPER_ADMIN')
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailsUser, setDetailsUser] = useState(null)
  const [action, setAction] = useState(null)
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

  const openStatusAction = (user) => setAction({ id: user.id, type: 'status', status: user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', user })

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
      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadUsers(1)} placeholder="Search name, email, phone" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All roles</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
          <label className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} placeholder="Division, district, area" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <input type="date" value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <input type="date" value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <div className="flex gap-2 md:col-span-2 xl:col-span-2"><Button onClick={() => loadUsers(1)} className="flex-1">Apply filters</Button><Button variant="secondary" onClick={() => { setFilters({ search: '', role: '', status: '', location: '', createdFrom: '', createdTo: '' }); setTimeout(() => loadUsers(1), 0) }}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadUsers(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading users" className="mt-6" />}
      {!loading && !error && users.length === 0 && <div className="mt-6"><EmptyState icon={Users} title="No users found" message="Try changing the filters or check the database connection." /></div>}
      {!loading && !error && users.length > 0 && (
        <GlassCard className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Actions</th></tr></thead>
              <tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(user)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><UserRound size={17} /></span><span><span className="block font-medium text-white">{user.name}</span><span className="block text-xs text-slate-500">{user.email}</span></span></button></td><td className="px-5 py-4"><span className="text-slate-300">{user.role}</span></td><td className="px-5 py-4"><StatusBadge status={user.accountStatus} /></td><td className="px-5 py-4 text-slate-400">{user.location ? [user.location.division, user.location.district].filter(Boolean).join(' / ') : '—'}</td><td className="px-5 py-4 text-slate-400">{formatDate(user.createdAt)}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => openDetails(user)}>Details</Button><Button size="sm" variant={user.accountStatus === 'ACTIVE' ? 'emergency' : 'primary'} onClick={() => openStatusAction(user)}>{user.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}</Button>{user.role !== 'SUPER_ADMIN' && <select value="" onChange={(event) => { if (event.target.value) setAction({ id: user.id, type: 'role', role: event.target.value, user }) }} className="h-9 rounded-full border border-white/10 bg-slate-900 px-3 text-xs text-white"><option value="">Change role</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select>}</div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} accounts</p><div className="flex items-center gap-2"><button disabled={pagination.page <= 1 || loading} onClick={() => loadUsers(pagination.page - 1)} className="rounded-full border border-white/10 p-2 disabled:opacity-40"><ChevronLeft size={16} /></button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page >= pagination.pages || loading} onClick={() => loadUsers(pagination.page + 1)} className="rounded-full border border-white/10 p-2 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
        </GlassCard>
      )}

      {detailsUser && <UserDetails user={detailsUser} onClose={() => setDetailsUser(null)} />}
      <ConfirmModal open={Boolean(action)} onClose={() => setAction(null)} onConfirm={action?.type === 'status' ? submitStatusChange : submitRoleChange} title={action?.type === 'status' ? `${action.status === 'SUSPENDED' ? 'Suspend' : 'Activate'} account?` : 'Change user role?'} description={action?.type === 'status' ? `This will ${action.status === 'SUSPENDED' ? 'suspend' : 'activate'} ${action.user?.name}. This action will be audited.` : `Change ${action?.user?.name} from ${action?.user?.role} to ${action?.role}. The backend will enforce role permissions.`} confirmText={action?.type === 'status' ? 'Confirm status change' : 'Save role'} />
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Activity size={14} /> Every sensitive action is recorded in the administrator audit log.</div>
    </AdminPageContainer>
  )
}

export default AdminUsers

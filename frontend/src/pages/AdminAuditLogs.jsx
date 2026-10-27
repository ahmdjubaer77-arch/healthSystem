import { CheckCircle2, Filter, FileClock, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminBreadcrumb from '../components/admin/AdminBreadcrumb'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import { useAuth } from '../context/AuthContext'
import { getAdminAuditLogs } from '../services/api'

const STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILURE', label: 'Failure' },
  { value: 'PENDING', label: 'Pending' },
]

function formatDate(value) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusClass(status) {
  if (status === 'SUCCESS') return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
  if (status === 'FAILURE') return 'border-rose-300/20 bg-rose-400/10 text-rose-100'
  return 'border-amber-300/20 bg-amber-400/10 text-amber-100'
}

function AdminAuditLogs() {
  const { accessToken } = useAuth()
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [options, setOptions] = useState({ actions: [], resourceTypes: [], statuses: [], admins: [] })
  const [filters, setFilters] = useState({ actor: '', action: '', resourceType: '', startDate: '', endDate: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminAuditLogs(accessToken, { ...activeFilters, page, limit: 20 })
      setLogs(result.logs)
      setPagination(result.pagination)
      setOptions(result.options)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLogs(1) }, [])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <AdminPageContainer>
      <AdminBreadcrumb items={[]} />
      <AdminPageHeader
        eyebrow="Security"
        title="Audit logs"
        description="Read-only record of privileged administrative actions and affected resources."
      />

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select value={filters.actor} onChange={(event) => updateFilter('actor', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All admins</option>{options.admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name} ({admin.role})</option>)}</select>
          <select value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All actions</option>{options.actions.map((action) => <option key={action}>{action}</option>)}</select>
          <select value={filters.resourceType} onChange={(event) => updateFilter('resourceType', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All resource types</option>{options.resourceTypes.map((resourceType) => <option key={resourceType}>{resourceType}</option>)}</select>
          <input type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <input type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All results</option>{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          <div className="flex gap-2 md:col-span-3">
            <button type="button" onClick={() => loadLogs(1)} className="flex-1 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Apply filters</button>
            <button type="button" onClick={() => { const cleared = { actor: '', action: '', resourceType: '', startDate: '', endDate: '', status: '' }; setFilters(cleared); loadLogs(1, cleared) }} className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">Clear</button>
          </div>
        </div>
      </section>

      {error && <div className="mt-6"><ErrorState title="Audit log unavailable" description={error} onRetry={() => loadLogs(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading audit logs" className="mt-6" />}
      {!loading && !error && logs.length === 0 && <div className="mt-6"><EmptyState icon={FileClock} title="No audit events found" message="No audit events match the selected filters." /></div>}
      {!loading && !error && logs.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Admin</th><th className="px-5 py-4">Admin role</th><th className="px-5 py-4">Action</th><th className="px-5 py-4">Resource type</th><th className="px-5 py-4">Resource ID</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Timestamp</th></tr></thead>
              <tbody>{logs.map((log) => <tr key={log.id} className="border-b border-white/[0.06] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><ShieldAlert size={15} /></span><div><p className="font-medium text-white">{log.actor || 'Unknown admin'}</p><p className="text-xs text-slate-500">{log.actorId || ''}</p></div></div></td><td className="px-5 py-4 text-slate-300">{log.actorRole}</td><td className="px-5 py-4 font-mono text-xs text-cyan-100">{log.action}</td><td className="px-5 py-4 text-slate-300">{log.resourceType}</td><td className="max-w-xs break-all px-5 py-4 font-mono text-xs text-slate-500">{log.resourceId}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusClass(log.result)}`}>{log.result}</span></td><td className="px-5 py-4 text-slate-400">{formatDate(log.timestamp)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} events</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => loadLogs(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadLogs(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div>
        </section>
      )}
      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} className="text-emerald-300" /> Audit logs are read-only. Access is restricted to SUPER_ADMIN.</p>
    </AdminPageContainer>
  )
}

export default AdminAuditLogs

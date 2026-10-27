import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Activity, Droplets, FileWarning, Filter, MapPin, Search, ShieldAlert, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminBloodRequests, getAdminBloodRequest, updateAdminBloodRequestStatus, reportAdminBloodRequest } from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import RequestReasonModal from '../components/admin/RequestReasonModal'
import ConfirmModal from '../components/common/ConfirmModal'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const WORKFLOW_TRANSITIONS = {
  PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['EXPIRED', 'CANCELLED'],
  MATCHED: ['CANCELLED'],
  FULFILLED: [],
  EXPIRED: [],
  CANCELLED: ['PENDING'],
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function RequestDetails({ request, loading, nextStatus, onNextStatus, onChangeStatus, onFlag, onClose }) {
  if (!request) return null
  const details = [
    ['Blood group', request.bloodGroup],
    ['Quantity', `${request.quantity} ${request.unit}`],
    ['Hospital', request.hospitalName],
    ['Division', request.division],
    ['District', request.district],
    ['Upazila', request.upazila],
    ['Location type', request.locationType],
    ['Created', formatDate(request.createdAt)],
    ['Updated', formatDate(request.updatedAt)],
  ]
  const transitions = WORKFLOW_TRANSITIONS[request.status] || []

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Blood request</p><h2 className="mt-2 text-2xl font-semibold text-white">{request.requesterName}</h2><p className="mt-1 text-sm text-slate-400">Request review</p></div><button type="button" onClick={onClose} aria-label="Close request details" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><StatusBadge status={request.status} /><span className="text-xs text-slate-500">Verification: {request.verificationStatus}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-words text-sm text-slate-200">{value || 'Not provided'}</p></div>)}</div>
        {request.reportReason && <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-widest text-amber-200/70">Flagged for review</p><p className="mt-2 text-sm text-slate-300">{request.reportReason}</p><p className="mt-2 text-xs text-slate-500">Flagged {formatDate(request.reportedAt)}</p></div>}
        <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Activity size={17} className="text-cyan-300" /> Workflow status</div>
          {transitions.length ? <div className="mt-4 flex flex-wrap items-center gap-2"><select aria-label="Next workflow status" value={nextStatus} onChange={(event) => onNextStatus(event.target.value)} className="h-10 min-w-40 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none">{transitions.map((status) => <option key={status} value={status}>{status}</option>)}</select><Button size="sm" disabled={loading || !nextStatus} onClick={() => onChangeStatus(nextStatus)}>Update status</Button></div> : <p className="mt-3 text-sm text-slate-500">This request has no available workflow transitions.</p>}
          <p className="mt-3 text-xs leading-5 text-slate-500">Status changes do not match donors or confirm hospitals. Donor matching and fulfillment confirmation are not available here.</p>
        </section>
        <section className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-400/[0.035] p-4"><div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert size={17} className="text-amber-200" /> Moderation</div><p className="mt-2 text-xs leading-5 text-slate-500">Flagging records a review reason without changing the request status.</p><div className="mt-4"><Button size="sm" variant="secondary" disabled={loading} onClick={onFlag}><FileWarning size={15} /> Flag suspicious</Button></div></section>
        <p className="mt-6 text-xs leading-5 text-slate-600">Requester account identifiers and contact details are not shown. Only general location labels are available.</p>
      </aside>
    </div>
  )
}

function AdminBloodRequests() {
  const { accessToken } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [filters, setFilters] = useState(() => ({
    status: STATUS_OPTIONS.includes(searchParams.get('status')) ? searchParams.get('status') : '',
    bloodGroup: '',
    search: '',
    location: '',
  }))
  const [selected, setSelected] = useState(null)
  const [nextStatus, setNextStatus] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminBloodRequests(accessToken, { ...activeFilters, page, limit: 20 })
      setRecords(result.requests)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const openDetails = async (record) => {
    setLoading(true)
    setError('')
    try {
      const request = await getAdminBloodRequest(accessToken, record.id)
      setSelected(request)
      setNextStatus(WORKFLOW_TRANSITIONS[request.status]?.[0] || '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitStatus = async (status, cancellationReason = '') => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminBloodRequestStatus(accessToken, selected.id, status, cancellationReason)
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
      setSelected(updated)
      setNextStatus(WORKFLOW_TRANSITIONS[updated.status]?.[0] || '')
      setPendingAction(null)
      setReason('')
      await load(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitFlag = async () => {
    if (!selected || !reason.trim()) return
    setLoading(true)
    setError('')
    try {
      const updated = await reportAdminBloodRequest(accessToken, selected.id, reason.trim())
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
      setSelected(updated)
      setPendingAction(null)
      setReason('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setSearchParams(params, { replace: true })
    load(1, filters)
  }
  const clearFilters = () => {
    const cleared = { status: '', bloodGroup: '', search: '', location: '' }
    setFilters(cleared)
    setSearchParams({}, { replace: true })
    load(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader eyebrow="Emergency operations" title="Blood request management" description="Review and moderate blood requests without exposing requester contact details." />

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Request filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilters} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search requester or hospital" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="status" value={filters.status} onChange={updateFilters} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All workflow statuses</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>
          <select name="bloodGroup" value={filters.bloodGroup} onChange={updateFilters} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All blood groups</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
          <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="location" value={filters.location} onChange={updateFilters} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by location" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none" /></label>
          <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => load(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading blood requests" className="mt-6" />}
      {!loading && !error && records.length === 0 && <div className="mt-6"><EmptyState icon={Droplets} title="No blood requests found" description="No requests match these filters." /></div>}
      {!loading && !error && records.length > 0 && <GlassCard className="mt-6 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Requester</th><th className="px-5 py-4">Blood group</th><th className="px-5 py-4">Workflow</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><span className="font-medium text-white">{record.requesterName}</span><span className="mt-1 block text-xs text-slate-500">{record.hospitalName || 'Hospital not specified'}</span></td><td className="px-5 py-4 font-semibold text-white">{record.bloodGroup}</td><td className="px-5 py-4"><StatusBadge status={record.status} />{record.reportReason && <span className="ml-2 text-xs text-amber-200">Flagged</span>}</td><td className="px-5 py-4 text-slate-400">{[record.division, record.district, record.upazila].filter(Boolean).join(' / ') || '-'}</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(record.createdAt)}</td><td className="px-5 py-4"><Button size="sm" variant="secondary" onClick={() => openDetails(record)}>Review request</Button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} requests</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => load(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div></GlassCard>}

      <RequestDetails request={selected} loading={loading} nextStatus={nextStatus} onNextStatus={setNextStatus} onChangeStatus={(status) => { setReason(''); setPendingAction({ kind: status === 'CANCELLED' ? 'cancel' : 'status', status }) }} onFlag={() => { setReason(''); setPendingAction({ kind: 'flag' }) }} onClose={() => setSelected(null)} />

      <ConfirmModal open={pendingAction?.kind === 'status'} onClose={() => setPendingAction(null)} onConfirm={() => submitStatus(pendingAction.status)} title="Update request status?" description="This workflow update will be audited. It does not match donors or confirm a hospital." confirmText="Update status" />
      <RequestReasonModal open={pendingAction?.kind === 'cancel'} title="Cancel fraudulent request" description="Provide the reason this request is being cancelled. The request status will become CANCELLED." value={reason} onChange={setReason} onClose={() => setPendingAction(null)} onConfirm={() => submitStatus('CANCELLED', reason)} loading={loading} confirmText="Cancel request" />
      <RequestReasonModal open={pendingAction?.kind === 'flag'} title="Flag suspicious request" description="Record a moderation note. Flagging does not change the request status." value={reason} onChange={setReason} onClose={() => setPendingAction(null)} onConfirm={submitFlag} loading={loading} confirmText="Flag for review" />
    </AdminPageContainer>
  )
}

export default AdminBloodRequests

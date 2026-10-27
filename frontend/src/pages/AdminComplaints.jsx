import { useEffect, useState } from 'react'
import { AlertTriangle, Filter, MessageSquareWarning, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import { getAdminUsers } from '../services/api'
import {
  addAdminComplaintNote,
  assignAdminComplaint,
  escalateAdminComplaint,
  getAdminComplaint,
  getAdminComplaints,
  rejectAdminComplaint,
  resolveAdminComplaint,
  updateAdminComplaintStatus,
} from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import ConfirmModal from '../components/common/ConfirmModal'
import Button from '../components/common/Button'

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const PAGE_SIZE = 20

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function ActionReasonDialog({ action, reason, onChange, onClose, onConfirm, loading }) {
  if (!action) return null
  const config = {
    resolve: { title: 'Resolve complaint', prompt: 'Record the resolution and outcome. At least 10 characters are required.', label: 'Resolution information', button: 'Resolve complaint' },
    reject: { title: 'Reject complaint', prompt: 'Provide the rejection reason. At least 10 characters are required.', label: 'Rejection reason', button: 'Reject complaint' },
    escalate: { title: 'Escalate complaint', prompt: 'Explain why this complaint requires urgent escalation. At least 10 characters are required.', label: 'Escalation reason', button: 'Escalate complaint' },
  }[action]
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-white">{config.title}</h3>
        <p className="mt-2 text-sm text-slate-400">{config.prompt}</p>
        <label className="mt-4 block"><span className="mb-2 block text-sm font-medium text-slate-200">{config.label}</span><textarea value={reason} onChange={(event) => onChange(event.target.value)} maxLength={2000} rows="5" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
        <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" icon={false} onClick={onClose}>Cancel</Button><Button variant="emergency" icon={false} disabled={reason.trim().length < 10 || loading} onClick={onConfirm}>{config.button}</Button></div>
      </GlassCard>
    </div>
  )
}

function ComplaintDetails({ complaint, canManage, admins, assignedAdminId, onAssignedAdminChange, onAssign, note, onNoteChange, onAddNote, onAction, loading, onClose }) {
  if (!complaint) return null
  const closed = ['RESOLVED', 'REJECTED'].includes(complaint.status)
  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Complaint detail</p><h2 className="mt-2 text-2xl font-semibold text-white">{complaint.title}</h2><p className="mt-1 text-sm text-slate-400">{complaint.category}</p></div><button type="button" onClick={onClose} aria-label="Close complaint details" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><StatusBadge status={complaint.status} /><StatusBadge status={complaint.priority} /><span className="text-xs text-slate-500">Created {formatDate(complaint.createdAt)}</span></div>
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500"><UserRound size={14} /> Reporter</div><p className="mt-2 text-sm text-slate-200">{complaint.reporter?.name || 'Reporter identity unavailable'}</p><p className="mt-1 text-xs text-slate-500">Contact details and account identifiers are withheld.</p></section>
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><h3 className="text-xs uppercase tracking-widest text-slate-500">Description</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{complaint.description}</p></section>

        {complaint.assignedAdmin && <div className="mt-4 text-sm text-slate-300">Assigned to {complaint.assignedAdmin.name}</div>}
        {canManage && !closed && <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="text-sm font-medium text-white">Assignment</h3><div className="mt-3 flex flex-wrap gap-2"><select aria-label="Assign administrator" value={assignedAdminId} onChange={(event) => onAssignedAdminChange(event.target.value)} className="h-10 min-w-48 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">Choose admin</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select><Button size="sm" disabled={loading || !assignedAdminId} onClick={() => onAssign()}>Assign admin</Button>{complaint.assignedAdmin && <Button size="sm" variant="secondary" disabled={loading} onClick={() => { onAssignedAdminChange(''); onAssign(null) }}>Unassign</Button>}</div></section>}

        {canManage && !closed && <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="text-sm font-medium text-white">Internal note</h3><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength={2000} rows="3" placeholder="Add an internal note" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-cyan-300/30" /><div className="mt-3 flex justify-end"><Button size="sm" disabled={!note.trim() || loading} onClick={onAddNote}>Add internal note</Button></div></section>}

        {complaint.internalNotes?.length > 0 && <section className="mt-5"><h3 className="text-sm font-medium text-white">Internal notes</h3><div className="mt-3 space-y-2">{complaint.internalNotes.map((entry, index) => <article key={`${entry.createdAt}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="flex justify-between gap-3"><span className="text-xs font-medium text-slate-300">{entry.author?.name || 'Administrator'}</span><time className="text-xs text-slate-500">{formatDate(entry.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{entry.note}</p></article>)}</div></section>}

        {complaint.resolutionInfo && <section className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-400/[0.04] p-4"><h3 className="text-xs uppercase tracking-widest text-emerald-200/70">Resolution information</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{complaint.resolutionInfo}</p></section>}
        {complaint.rejectionReason && <section className="mt-4 rounded-xl border border-red-300/10 bg-red-400/[0.04] p-4"><h3 className="text-xs uppercase tracking-widest text-red-200/70">Rejection reason</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{complaint.rejectionReason}</p></section>}
        {complaint.escalationReason && <section className="mt-4 rounded-xl border border-amber-300/10 bg-amber-400/[0.04] p-4"><h3 className="text-xs uppercase tracking-widest text-amber-200/70">Escalation reason</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{complaint.escalationReason}</p></section>}

        {canManage && !closed && <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="text-sm font-medium text-white">Moderation actions</h3><div className="mt-3 flex flex-wrap gap-2">{complaint.status === 'OPEN' ? <Button size="sm" variant="secondary" disabled={loading} onClick={() => onAction('IN_REVIEW')}>Mark in review</Button> : <Button size="sm" variant="secondary" disabled={loading} onClick={() => onAction('OPEN')}>Reopen</Button>}<Button size="sm" disabled={loading} onClick={() => onAction('resolve')}>Resolve</Button><Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('reject')}>Reject</Button><Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('escalate')}><AlertTriangle size={14} /> Escalate</Button></div></section>}
      </aside>
    </div>
  )
}

function AdminComplaints() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canManage = hasPermission('complaints.manage')
  const [complaints, setComplaints] = useState([])
  const [admins, setAdmins] = useState([])
  const [counts, setCounts] = useState({ OPEN: 0, IN_REVIEW: 0, RESOLVED: 0, REJECTED: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', category: '' })
  const [selected, setSelected] = useState(null)
  const [assignedAdminId, setAssignedAdminId] = useState('')
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [actionText, setActionText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const [result, adminResults, superAdminResults] = await Promise.all([
        getAdminComplaints(accessToken, { ...activeFilters, page, limit: PAGE_SIZE }),
        getAdminUsers(accessToken, { role: 'ADMIN', status: 'ACTIVE', limit: 100 }),
        getAdminUsers(accessToken, { role: 'SUPER_ADMIN', status: 'ACTIVE', limit: 100 }),
      ])
      setComplaints(result.complaints)
      setPagination(result.pagination)
      setCounts(result.counts)
      setAdmins([...adminResults.users, ...superAdminResults.users])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(1) }, [])

  const openDetails = async (complaint) => {
    setLoading(true)
    setError('')
    try {
      const details = await getAdminComplaint(accessToken, complaint.id)
      setSelected(details)
      setAssignedAdminId(details.assignedAdmin?.id || '')
      setNote('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshSelected = async (id) => {
    const updated = await getAdminComplaint(accessToken, id)
    setSelected(updated)
    setAssignedAdminId(updated.assignedAdmin?.id || '')
    return updated
  }

  const performAction = async () => {
    if (!pendingAction || !selected) return
    setLoading(true)
    setError('')
    try {
      let updated
      if (pendingAction.kind === 'status') updated = await updateAdminComplaintStatus(accessToken, selected.id, pendingAction.status)
      if (pendingAction.kind === 'resolve') updated = await resolveAdminComplaint(accessToken, selected.id, actionText)
      if (pendingAction.kind === 'reject') updated = await rejectAdminComplaint(accessToken, selected.id, actionText)
      if (pendingAction.kind === 'escalate') updated = await escalateAdminComplaint(accessToken, selected.id, actionText)
      setSelected(updated)
      setPendingAction(null)
      setActionText('')
      await loadData(pagination.page)
      await refreshSelected(selected.id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const assignAdmin = async (adminId = assignedAdminId) => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await assignAdminComplaint(accessToken, selected.id, adminId || null)
      await refreshSelected(selected.id)
      await loadData(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!selected || !note.trim()) return
    setLoading(true)
    setError('')
    try {
      await addAdminComplaintNote(accessToken, selected.id, note)
      setNote('')
      await refreshSelected(selected.id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const requestAction = (kind) => {
    setActionText('')
    setPendingAction({ kind, stage: 'confirm' })
  }

  const confirmAction = () => {
    if (['resolve', 'reject', 'escalate'].includes(pendingAction?.kind)) {
      setPendingAction((current) => ({ ...current, stage: 'details' }))
      return
    }
    performAction()
  }

  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const applyFilters = () => loadData(1)
  const clearFilters = () => {
    const cleared = { search: '', status: '', priority: '', category: '' }
    setFilters(cleared)
    loadData(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Complaint management" description="Review reports, assign administrators, and record internal actions and outcomes." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{STATUSES.map((status) => <GlassCard key={status} className="p-4"><p className="text-xs uppercase tracking-widest text-slate-500">{status.replace('_', ' ')}</p><p className="mt-3 text-2xl font-semibold text-white">{counts[status] || 0}</p></GlassCard>)}</div>

      <GlassCard className="mt-6 p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Complaint filters</div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search subject, category, or description" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
        <select name="status" value={filters.status} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <select name="priority" value={filters.priority} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All priorities</option>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select>
        <input name="category" value={filters.category} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Category" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
        <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
      </div></GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadData(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading complaints" className="mt-6" />}
      {!loading && !error && complaints.length === 0 && <div className="mt-6"><EmptyState icon={MessageSquareWarning} title="No complaints found" description="No complaints match these filters." /></div>}
      {!loading && !error && complaints.length > 0 && <GlassCard className="mt-6 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Complaint</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Priority</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Assigned admin</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead><tbody>{complaints.map((complaint) => <tr key={complaint.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><span className="block font-medium text-white">{complaint.title}</span><span className="mt-1 block text-xs text-slate-500">Reporter information protected</span></td><td className="px-5 py-4 text-slate-300">{complaint.category}</td><td className="px-5 py-4"><StatusBadge status={complaint.priority} /></td><td className="px-5 py-4"><StatusBadge status={complaint.status} /></td><td className="px-5 py-4 text-slate-400">{complaint.assignedAdmin?.name || 'Unassigned'}</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(complaint.createdAt)}</td><td className="px-5 py-4"><Button size="sm" variant="secondary" onClick={() => openDetails(complaint)}>View complaint</Button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} complaints</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadData(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadData(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div></GlassCard>}

      {selected && <ComplaintDetails complaint={selected} canManage={canManage} admins={admins} assignedAdminId={assignedAdminId} onAssignedAdminChange={setAssignedAdminId} onAssign={assignAdmin} note={note} onNoteChange={setNote} onAddNote={addNote} onAction={(kind) => kind === 'OPEN' || kind === 'IN_REVIEW' ? setPendingAction({ kind: 'status', status: kind, stage: 'confirm' }) : requestAction(kind)} loading={loading} onClose={() => setSelected(null)} />}

      <ConfirmModal open={Boolean(pendingAction?.stage === 'confirm')} onClose={() => setPendingAction(null)} onConfirm={confirmAction} title={pendingAction?.kind === 'resolve' ? 'Resolve complaint?' : pendingAction?.kind === 'reject' ? 'Reject complaint?' : pendingAction?.kind === 'escalate' ? 'Escalate complaint?' : `Change complaint status to ${pendingAction?.status}?`} description={pendingAction?.kind === 'resolve' ? 'Resolution details will be required before the complaint can be closed.' : pendingAction?.kind === 'reject' ? 'A rejection reason will be required before the complaint can be closed.' : pendingAction?.kind === 'escalate' ? 'Escalation will set priority to URGENT and record the reason.' : 'This status update will be recorded in the audit log.'} confirmText="Continue" />
      <ActionReasonDialog action={pendingAction?.stage === 'details' ? pendingAction.kind : null} reason={actionText} onChange={setActionText} onClose={() => setPendingAction(null)} onConfirm={performAction} loading={loading} />
    </AdminPageContainer>
  )
}

export default AdminComplaints
import { useEffect, useState } from 'react'
import { Activity, Filter, MapPin, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import { getAdminEmergencyRequests, getAdminEmergencyRequest, updateAdminEmergencyRequestStatus } from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import AdminRequestTable from '../components/admin/AdminRequestTable'
import RequestDetailsDrawer from '../components/admin/RequestDetailsDrawer'
import RequestReasonModal from '../components/admin/RequestReasonModal'
import ConfirmModal from '../components/common/ConfirmModal'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']

function AdminEmergencyRequests() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canManage = hasPermission('emergency.manage')
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ status: '', requestType: '', search: '', location: '' })
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminEmergencyRequests(accessToken, { ...activeFilters, page, limit: 20 })
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
      setSelected(await getAdminEmergencyRequest(accessToken, record.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitStatus = async () => {
    if (!action || (action.status === 'CANCELLED' && !reason.trim())) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminEmergencyRequestStatus(accessToken, action.id, action.status, reason)
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
      setSelected(updated)
      setAction(null)
      setReason('')
      await load(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const applyFilters = () => load(1)
  const clearFilters = () => {
    const cleared = { status: '', requestType: '', search: '', location: '' }
    setFilters(cleared)
    load(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader eyebrow="Emergency operations" title="Emergency request management" description="Review requests, broad location labels, and recorded hospital or ambulance references." />
      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Request filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search requester, request type, or provider" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="status" value={filters.status} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>
          <input name="requestType" value={filters.requestType} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by request type" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
          <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="location" value={filters.location} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter broad location" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none" /></label>
          <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>
      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => load(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading emergency requests" className="mt-6" />}
      {!loading && !error && records.length === 0 && <div className="mt-6"><EmptyState icon={Activity} title="No emergency requests found" description="No emergency requests match these filters." /></div>}
      {!loading && !error && records.length > 0 && <div className="mt-6"><AdminRequestTable records={records} pagination={pagination} loading={loading} onSelect={openDetails} onPageChange={(page) => load(page)} typeLabel="Emergency" /></div>}
      <RequestDetailsDrawer request={selected} type="Emergency" onClose={() => setSelected(null)} onStatusChange={(status) => { setAction({ id: selected.id, status, reason: '' }); setReason('') }} onReport={() => {}} loading={loading} canManage={canManage} />
      <ConfirmModal open={Boolean(action && action.status !== 'CANCELLED')} onClose={() => setAction(null)} onConfirm={submitStatus} title={`Set request status to ${action?.status || ''}?`} description="The backend will save and audit this status. It does not dispatch an ambulance or confirm hospital acceptance." confirmText="Save status" />
      <RequestReasonModal open={Boolean(action?.status === 'CANCELLED')} title="Cancel emergency request" description="Provide the cancellation reason. This status change will be saved and audited by the backend." value={reason} onChange={setReason} onClose={() => { setAction(null); setReason('') }} onConfirm={submitStatus} loading={loading} confirmText="Confirm cancellation" />
    </AdminPageContainer>
  )
}

export default AdminEmergencyRequests

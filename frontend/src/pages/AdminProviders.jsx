import { useEffect, useState } from 'react'
import { Filter, MapPin, Search, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminProviders, getAdminProvider, updateAdminProviderStatus } from '../services/api'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import ProviderTable from '../components/admin/ProviderTable'
import ProviderDetailsDrawer from '../components/admin/ProviderDetailsDrawer'
import ConfirmModal from '../components/common/ConfirmModal'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'

const PROVIDER_TYPES = ['Doctor', 'Hospital', 'Pharmacy', 'Ambulance Provider']
const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']

function AdminProviders() {
  const { accessToken } = useAuth()
  const [providers, setProviders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ providerType: '', verificationStatus: '', division: '', district: '', upazila: '', createdFrom: '', createdTo: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [action, setAction] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadProviders = async (page = pagination.page) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminProviders(accessToken, { ...filters, page, limit: 20 })
      setProviders(result.providers)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProviders(1) }, [])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const openDetails = async (provider) => {
    setLoading(true)
    setError('')
    try {
      setSelectedProvider(await getAdminProvider(accessToken, provider.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitStatusChange = async () => {
    if (!action) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminProviderStatus(accessToken, action.id, action.status, action.reason)
      setProviders((current) => current.map((provider) => provider.id === updated.id ? updated : provider))
      setSelectedProvider(updated)
      setAction(null)
      setRejectionReason('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const requestStatusChange = (status) => {
    setAction({ id: selectedProvider.id, status, reason: '' })
  }

  const openRejectDialog = () => {
    setAction({ id: selectedProvider.id, status: 'REJECTED', reason: '' })
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Provider management" description="Review provider registrations, verify credentials, reject unsafe records, suspend accounts, and restore them when appropriate." />

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select value={filters.providerType} onChange={(event) => updateFilter('providerType', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All provider types</option>{PROVIDER_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          <select value={filters.verificationStatus} onChange={(event) => updateFilter('verificationStatus', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All verification statuses</option>{VERIFICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
          <label className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={filters.division} onChange={(event) => updateFilter('division', event.target.value)} placeholder="Division" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <label className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={filters.district} onChange={(event) => updateFilter('district', event.target.value)} placeholder="District" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <label className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={filters.upazila} onChange={(event) => updateFilter('upazila', event.target.value)} placeholder="Upazila" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <input type="date" value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <input type="date" value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none" />
          <div className="flex gap-2 md:col-span-2 xl:col-span-2"><Button onClick={() => loadProviders(1)} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" onClick={() => { setFilters({ providerType: '', verificationStatus: '', division: '', district: '', upazila: '', createdFrom: '', createdTo: '' }); setTimeout(() => loadProviders(1), 0) }}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadProviders(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading provider records" className="mt-6" />}
      {!loading && !error && providers.length === 0 && <div className="mt-6"><EmptyState icon={ShieldCheck} title="No providers found" message="No provider records match these filters." /></div>}
      {!loading && !error && providers.length > 0 && <div className="mt-6"><ProviderTable providers={providers} pagination={pagination} loading={loading} onSelect={openDetails} onPageChange={loadProviders} /></div>}

      <ProviderDetailsDrawer provider={selectedProvider} onClose={() => setSelectedProvider(null)} onVerify={() => requestStatusChange('VERIFIED')} onReject={openRejectDialog} onSuspend={() => requestStatusChange('SUSPENDED')} onRestore={() => requestStatusChange('VERIFIED')} loading={loading} />

      <ConfirmModal
        open={Boolean(action && action.status !== 'REJECTED')}
        onClose={() => setAction(null)}
        onConfirm={submitStatusChange}
        title={action?.status === 'VERIFIED' ? 'Verify provider?' : action?.status === 'SUSPENDED' ? 'Suspend provider?' : 'Restore provider?'}
        description={action?.status === 'VERIFIED' ? 'The provider will be marked VERIFIED and this action will be audited.' : action?.status === 'SUSPENDED' ? 'The provider will be marked SUSPENDED and this action will be audited.' : 'The provider will be restored to VERIFIED status and this action will be audited.'}
        confirmText={action?.status === 'VERIFIED' ? 'Verify provider' : action?.status === 'SUSPENDED' ? 'Suspend provider' : 'Restore provider'}
      />
      {action?.status === 'REJECTED' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">Rejection reason</h3><p className="mt-2 text-sm text-slate-400">Provide the specific reason this provider cannot be verified.</p><textarea value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); setAction((current) => current ? { ...current, reason: event.target.value } : current) }} rows="4" className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Example: missing registration documents" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button><Button variant="emergency" disabled={!rejectionReason.trim() || loading} onClick={submitStatusChange}>Confirm rejection</Button></div></GlassCard></div>}
    </AdminPageContainer>
  )
}

export default AdminProviders

import { useEffect, useState } from 'react'
import { Ambulance, Building2, CheckCircle2, Filter, Pill, Search, ShieldAlert, ShieldCheck, Stethoscope, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import {
  getAdminProviders,
  getAdminVerificationSummary,
  getAdminDoctor,
  getAdminHospital,
  getAdminPharmacy,
  getAdminAmbulance,
  updateAdminDoctorVerification,
  updateAdminDoctorStatus,
  updateAdminHospitalVerification,
  updateAdminHospitalStatus,
  updateAdminPharmacyVerification,
  updateAdminPharmacyStatus,
  updateAdminAmbulanceVerification,
  updateAdminAmbulanceStatus,
} from '../services/api'
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

const PROVIDER_TABS = [
  { type: 'Doctor', label: 'Doctors', icon: Stethoscope },
  { type: 'Hospital', label: 'Hospitals', icon: Building2 },
  { type: 'Pharmacy', label: 'Pharmacies', icon: Pill },
  { type: 'Ambulance Provider', label: 'Ambulances', icon: Ambulance },
]
const STATUS_CARDS = [
  { status: 'PENDING', label: 'Pending', icon: ShieldAlert, iconClass: 'bg-amber-400/10 text-amber-200' },
  { status: 'VERIFIED', label: 'Verified', icon: CheckCircle2, iconClass: 'bg-emerald-400/10 text-emerald-200' },
  { status: 'REJECTED', label: 'Rejected', icon: XCircle, iconClass: 'bg-rose-400/10 text-rose-200' },
  { status: 'SUSPENDED', label: 'Suspended', icon: ShieldCheck, iconClass: 'bg-slate-400/10 text-slate-200' },
]
const VERIFICATION_PERMISSIONS = {
  Doctor: 'doctors.verify',
  Hospital: 'hospitals.verify',
  Pharmacy: 'pharmacies.verify',
  'Ambulance Provider': 'ambulances.verify',
}
const DETAIL_LOADERS = {
  Doctor: getAdminDoctor,
  Hospital: getAdminHospital,
  Pharmacy: getAdminPharmacy,
  'Ambulance Provider': getAdminAmbulance,
}
const VERIFICATION_UPDATERS = {
  Doctor: updateAdminDoctorVerification,
  Hospital: updateAdminHospitalVerification,
  Pharmacy: updateAdminPharmacyVerification,
  'Ambulance Provider': updateAdminAmbulanceVerification,
}
const STATUS_UPDATERS = {
  Doctor: updateAdminDoctorStatus,
  Hospital: updateAdminHospitalStatus,
  Pharmacy: updateAdminPharmacyStatus,
  'Ambulance Provider': updateAdminAmbulanceStatus,
}
const STATUS_OPTIONS = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']

function normalizeSubmittedDocuments(provider, detail) {
  if (provider.submittedDocuments?.length) return provider.submittedDocuments
  if (detail.submittedDocuments?.length) return detail.submittedDocuments
  return (detail.submittedCredentials || []).map((credential) => ({
    documentType: credential.documentType,
    fileName: credential.fileName,
    uploadedAt: credential.uploadedAt,
  }))
}

function AdminVerifications() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const [summary, setSummary] = useState(null)
  const [providers, setProviders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [providerType, setProviderType] = useState('Doctor')
  const [filters, setFilters] = useState({ search: '', verificationStatus: 'PENDING' })
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [action, setAction] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async (activeType = providerType, page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const [summaryResult, providerResult] = await Promise.all([
        getAdminVerificationSummary(accessToken),
        getAdminProviders(accessToken, { ...activeFilters, providerType: activeType, page, limit: 20 }),
      ])
      setSummary(summaryResult)
      setProviders(providerResult.providers)
      setPagination(providerResult.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData('Doctor', 1) }, [])

  const selectProviderType = (type) => {
    setProviderType(type)
    setSelectedProvider(null)
    setAction(null)
    loadData(type, 1)
  }

  const openDetails = async (provider) => {
    setLoading(true)
    setError('')
    try {
      const detail = await DETAIL_LOADERS[providerType](accessToken, provider.id)
      setSelectedProvider({
        ...provider,
        ...detail,
        providerType,
        submittedDocuments: normalizeSubmittedDocuments(provider, detail),
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const submitStatusChange = async () => {
    if (!action || !canVerify) return
    if (action.status === 'REJECTED' && !rejectionReason.trim()) return
    setLoading(true)
    setError('')
    try {
      const updated = ['VERIFIED', 'REJECTED'].includes(action.status)
        ? await VERIFICATION_UPDATERS[action.providerType](accessToken, action.id, action.status, rejectionReason)
        : await STATUS_UPDATERS[action.providerType](accessToken, action.id, action.status === 'SUSPENDED' ? 'SUSPENDED' : 'RESTORE')
      const mergedProvider = {
        ...selectedProvider,
        ...updated,
        submittedDocuments: selectedProvider?.submittedDocuments || [],
      }
      setSelectedProvider(mergedProvider)
      setProviders((current) => current.map((provider) => provider.id === updated.id ? { ...provider, ...updated } : provider))
      setAction(null)
      setRejectionReason('')
      await loadData(providerType, pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const requestAction = (status) => {
    if (!selectedProvider || !canVerify) return
    setAction({ id: selectedProvider.id, providerType: selectedProvider.providerType, status })
    setRejectionReason('')
  }

  const canVerify = hasPermission(VERIFICATION_PERMISSIONS[providerType])
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const applyFilters = () => loadData(providerType, 1)
  const clearFilters = () => {
    const cleared = { search: '', verificationStatus: '' }
    setFilters(cleared)
    loadData(providerType, 1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader eyebrow="Compliance" title="Admin Verification Center" description="Review provider submissions and manage their verification status." />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_CARDS.map((card) => {
          const Icon = card.icon
          return <GlassCard key={card.status} className="p-4"><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClass}`}><Icon size={17} /></span><span className="text-2xl font-semibold text-white">{summary?.[card.status.toLowerCase()] || 0}</span></div><p className="mt-4 text-sm font-medium text-slate-200">{card.label}</p><p className="mt-1 text-xs text-slate-500">All provider types</p></GlassCard>
        })}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-2">
        {PROVIDER_TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.type} type="button" onClick={() => selectProviderType(tab.type)} className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${providerType === tab.type ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={15} />{tab.label}</button> })}
      </div>

      <GlassCard className="mt-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder={`Search ${PROVIDER_TABS.find((tab) => tab.type === providerType)?.label.toLowerCase()}`} className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="verificationStatus" value={filters.verificationStatus} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All verification statuses</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>
          <div className="flex gap-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadData(providerType, pagination.page)} /></div>}
      {loading && <LoadingState label={`Loading ${PROVIDER_TABS.find((tab) => tab.type === providerType)?.label.toLowerCase()}`} className="mt-6" />}
      {!loading && !error && providers.length === 0 && <div className="mt-6"><EmptyState icon={ShieldCheck} title="No providers found" description="No provider records match these filters." /></div>}
      {!loading && !error && providers.length > 0 && <div className="mt-6"><ProviderTable providers={providers} pagination={pagination} loading={loading} onSelect={openDetails} onPageChange={(page) => loadData(providerType, page)} /></div>}

      <ProviderDetailsDrawer
        provider={selectedProvider}
        verificationCenter
        canManage={canVerify}
        onClose={() => setSelectedProvider(null)}
        onVerify={() => requestAction('VERIFIED')}
        onReject={() => requestAction('REJECTED')}
        onSuspend={() => requestAction('SUSPENDED')}
        onRestore={() => requestAction('RESTORE')}
        loading={loading}
      />

      <ConfirmModal
        open={Boolean(action && action.status !== 'REJECTED')}
        onClose={() => setAction(null)}
        onConfirm={submitStatusChange}
        title={action?.status === 'VERIFIED' ? 'Verify provider?' : action?.status === 'SUSPENDED' ? 'Suspend provider?' : 'Restore provider?'}
        description={action?.status === 'VERIFIED' ? 'The provider will be marked VERIFIED. This action is audited.' : action?.status === 'SUSPENDED' ? 'The provider will be marked SUSPENDED. This action is audited.' : 'The suspended provider will be restored as VERIFIED. This action is audited.'}
        confirmText={action?.status === 'VERIFIED' ? 'Verify provider' : action?.status === 'SUSPENDED' ? 'Suspend provider' : 'Restore provider'}
      />

      {action?.status === 'REJECTED' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">Reject provider verification</h3><p className="mt-2 text-sm text-slate-400">A rejection reason is required and will be audited.</p><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows="4" className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Enter the rejection reason" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" icon={false} onClick={() => setAction(null)}>Cancel</Button><Button variant="emergency" icon={false} disabled={!rejectionReason.trim() || loading} onClick={submitStatusChange}>Confirm rejection</Button></div></GlassCard></div>}
    </AdminPageContainer>
  )
}

export default AdminVerifications

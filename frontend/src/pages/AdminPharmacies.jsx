import { useEffect, useState } from 'react'
import { Building2, Filter, MapPin, Pencil, Plus, Search, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import {
  createAdminPharmacy,
  getAdminPharmacies,
  getAdminPharmacy,
  updateAdminPharmacy,
  updateAdminPharmacyStatus,
  updateAdminPharmacyVerification,
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

const STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']
const PAGE_SIZE = 20
const EMPTY_FORM = {
  name: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  division: '',
  district: '',
  upazila: '',
  registrationNumber: '',
  licenseNumber: '',
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function PharmacyForm({ form, onChange, onClose, onSubmit, saving, mode }) {
  const fields = [
    ['name', 'Pharmacy name', true],
    ['contactEmail', 'Contact email', false],
    ['contactPhone', 'Contact phone', false],
    ['address', 'Address', true],
    ['division', 'Division', false],
    ['district', 'District', false],
    ['upazila', 'Upazila', false],
    ['registrationNumber', 'Registration number', false],
    ['licenseNumber', 'License number', false],
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <GlassCard className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Pharmacy management</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{mode === 'create' ? 'Add pharmacy' : 'Edit pharmacy'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, required]) => (
            <label key={name} className={name === 'address' ? 'sm:col-span-2' : ''}>
              <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
              <input
                name={name}
                type={name === 'contactEmail' ? 'email' : 'text'}
                value={form[name]}
                onChange={onChange}
                required={required}
                maxLength={name === 'name' ? 160 : name === 'address' ? 240 : name === 'contactEmail' ? 160 : name === 'contactPhone' ? 30 : ['division', 'district', 'upazila'].includes(name) ? 120 : 120}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/10"
              />
            </label>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" icon={false} onClick={onClose}>Cancel</Button>
            <Button type="submit" icon={false} disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Add pharmacy' : 'Save changes'}</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

function PharmacyDetails({ pharmacy, loading, canUpdate, canVerify, onClose, onEdit, onAction }) {
  if (!pharmacy) return null
  const details = [
    ['Contact email', pharmacy.contactEmail],
    ['Contact phone', pharmacy.contactPhone],
    ['Address', pharmacy.address],
    ['Division', pharmacy.division],
    ['District', pharmacy.district],
    ['Upazila', pharmacy.upazila],
    ['Registration number', pharmacy.registrationNumber],
    ['License number', pharmacy.licenseNumber],
    ['Created', formatDate(pharmacy.createdAt)],
    ['Updated', formatDate(pharmacy.updatedAt)],
  ]

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Pharmacy details</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{pharmacy.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close pharmacy details" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button>
        </div>
        <div className="mt-5 flex items-center gap-3"><StatusBadge status={pharmacy.verificationStatus} /><span className="text-xs text-slate-500">Created {formatDate(pharmacy.createdAt)}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-all text-sm text-slate-200">{value || 'Not provided'}</p></div>)}
        </div>
        {pharmacy.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-widest text-red-300/70">Rejection reason</p><p className="mt-2 text-sm text-slate-300">{pharmacy.verificationReason}</p></div>}
        <div className="mt-6 flex flex-wrap gap-2">
          {canUpdate && <Button size="sm" variant="secondary" icon={false} onClick={onEdit} disabled={loading}><Pencil size={14} /> Edit</Button>}
          {canVerify && pharmacy.verificationStatus !== 'VERIFIED' && pharmacy.verificationStatus !== 'SUSPENDED' && <Button size="sm" icon={false} onClick={() => onAction('verify')} disabled={loading}><ShieldCheck size={14} /> Verify</Button>}
          {canVerify && pharmacy.verificationStatus !== 'REJECTED' && pharmacy.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="emergency" icon={false} onClick={() => onAction('reject')} disabled={loading}>Reject</Button>}
          {canVerify && (pharmacy.verificationStatus === 'SUSPENDED'
            ? <Button size="sm" icon={false} onClick={() => onAction('restore')} disabled={loading}>Restore</Button>
            : <Button size="sm" variant="emergency" icon={false} onClick={() => onAction('suspend')} disabled={loading}>Suspend</Button>)}
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Private license documents are not available in the admin response.</p>
      </aside>
    </div>
  )
}

function AdminPharmacies() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canUpdate = hasPermission('pharmacies.update')
  const canVerify = hasPermission('pharmacies.verify')
  const [pharmacies, setPharmacies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ search: '', verificationStatus: '', location: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [formMode, setFormMode] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [pendingAction, setPendingAction] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadPharmacies = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminPharmacies(accessToken, { ...activeFilters, page, limit: PAGE_SIZE })
      setPharmacies(result.pharmacies)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPharmacies(1) }, [])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const openDetails = async (pharmacy) => {
    setLoading(true)
    setError('')
    try {
      setSelectedPharmacy(await getAdminPharmacy(accessToken, pharmacy.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormMode('create')
  }

  const openEdit = () => {
    if (!selectedPharmacy) return
    setForm(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, selectedPharmacy[key] || ''])))
    setFormMode('edit')
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (formMode === 'create') {
        await createAdminPharmacy(accessToken, form)
      } else {
        setSelectedPharmacy(await updateAdminPharmacy(accessToken, selectedPharmacy.id, form))
      }
      const isCreating = formMode === 'create'
      setFormMode('')
      await loadPharmacies(isCreating ? 1 : pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const performAction = async (action, reason = '') => {
    if (!selectedPharmacy) return
    setSaving(true)
    setError('')
    try {
      const updated = action === 'verify' || action === 'reject'
        ? await updateAdminPharmacyVerification(accessToken, selectedPharmacy.id, action === 'verify' ? 'VERIFIED' : 'REJECTED', reason)
        : await updateAdminPharmacyStatus(accessToken, selectedPharmacy.id, action === 'suspend' ? 'SUSPENDED' : 'RESTORE')
      setSelectedPharmacy(updated)
      setPharmacies((current) => current.map((pharmacy) => pharmacy.id === updated.id ? updated : pharmacy))
      setPendingAction(null)
      setRejectionReason('')
      await loadPharmacies(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const applyFilters = () => loadPharmacies(1)
  const clearFilters = () => {
    const cleared = { search: '', verificationStatus: '', location: '' }
    setFilters(cleared)
    loadPharmacies(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Pharmacy management" description="Search and manage pharmacy profiles, verification, and account status." action={canUpdate ? { label: 'Add pharmacy', icon: Plus, onClick: openCreate } : undefined} />

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search name, contact, license" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="verificationStatus" value={filters.verificationStatus} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All verification statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
          <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="location" value={filters.location} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by location" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <div className="flex gap-2 md:col-span-2 xl:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadPharmacies(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading pharmacies" className="mt-6" />}
      {!loading && !error && pharmacies.length === 0 && <div className="mt-6"><EmptyState title="No pharmacies found" description="No pharmacy records match these filters." /></div>}
      {!loading && !error && pharmacies.length > 0 && (
        <GlassCard className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Pharmacy</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Actions</th></tr></thead>
              <tbody>{pharmacies.map((pharmacy) => <tr key={pharmacy.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(pharmacy)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><Building2 size={17} /></span><span><span className="block font-medium text-white">{pharmacy.name}</span><span className="block text-xs text-slate-500">{pharmacy.licenseNumber || 'No license number'}</span></span></button></td><td className="px-5 py-4"><StatusBadge status={pharmacy.verificationStatus} /></td><td className="px-5 py-4 text-slate-400">{[pharmacy.division, pharmacy.district, pharmacy.upazila].filter(Boolean).join(' / ') || pharmacy.address || '-'}</td><td className="px-5 py-4 text-slate-400">{pharmacy.contactPhone || pharmacy.contactEmail || '-'}</td><td className="px-5 py-4 text-slate-400">{formatDate(pharmacy.createdAt)}</td><td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => openDetails(pharmacy)}>View</Button>{canUpdate && <Button size="sm" variant="secondary" onClick={() => openDetails(pharmacy)}><Pencil size={14} /> Edit</Button>}</div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} pharmacies</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadPharmacies(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadPharmacies(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
        </GlassCard>
      )}

      <PharmacyDetails
        pharmacy={pendingAction ? null : selectedPharmacy}
        loading={saving}
        canUpdate={canUpdate}
        canVerify={canVerify}
        onClose={() => setSelectedPharmacy(null)}
        onEdit={openEdit}
        onAction={(action) => setPendingAction({ action })}
      />

      {formMode && <PharmacyForm form={form} onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))} onClose={() => setFormMode('')} onSubmit={submitForm} saving={saving} mode={formMode} />}

      <ConfirmModal
        open={Boolean(pendingAction && pendingAction.action !== 'reject')}
        onClose={() => setPendingAction(null)}
        onConfirm={() => performAction(pendingAction.action)}
        title={pendingAction?.action === 'verify' ? 'Verify pharmacy?' : pendingAction?.action === 'suspend' ? 'Suspend pharmacy?' : 'Restore pharmacy?'}
        description={pendingAction?.action === 'verify' ? 'This pharmacy will be marked as verified. This action will be audited.' : pendingAction?.action === 'suspend' ? 'This pharmacy will be suspended. This action will be audited.' : 'This pharmacy will be restored to verified status. This action will be audited.'}
        confirmText={pendingAction?.action === 'verify' ? 'Verify pharmacy' : pendingAction?.action === 'suspend' ? 'Suspend pharmacy' : 'Restore pharmacy'}
      />

      {pendingAction?.action === 'reject' && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">Reject pharmacy verification</h3><p className="mt-2 text-sm text-slate-400">A reason is required and will be recorded in the audit log.</p><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows="4" className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Enter the rejection reason" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" icon={false} onClick={() => setPendingAction(null)}>Cancel</Button><Button variant="emergency" icon={false} disabled={!rejectionReason.trim() || saving} onClick={() => performAction('reject', rejectionReason)}>Reject pharmacy</Button></div></GlassCard></div>}
    </AdminPageContainer>
  )
}

export default AdminPharmacies
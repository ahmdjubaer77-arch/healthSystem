import { useEffect, useState } from 'react'
import { Ambulance, Filter, MapPin, Plus, Search, ShieldCheck, Truck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import {
  getAdminAmbulances,
  getAdminAmbulance,
  createAdminAmbulance,
  updateAdminAmbulance,
  updateAdminAmbulanceOperationalStatus,
  updateAdminAmbulanceStatus,
  updateAdminAmbulanceVerification,
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

const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']
const OPERATIONAL_STATUSES = ['AVAILABLE', 'BUSY', 'OFFLINE']
const PAGE_SIZE = 20
const EMPTY_PROVIDER_FORM = {
  name: '', contactPhone: '', address: '', division: '', district: '', upazila: '',
  serviceAreas: '', vehicles: [{ vehicleType: '', registrationNumber: '', capacity: '', equipment: '' }],
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function AdminAmbulanceDetails({ provider, loading, canVerify, canUpdate, operationalStatus, onOperationalStatusChange, onSaveOperationalStatus, onClose, onAction, onEdit }) {
  if (!provider) return null
  const details = [
    ['Contact phone', provider.contactPhone],
    ['Contact email', provider.contactEmail],
    ['Address', provider.address],
    ['Division', provider.division],
    ['District', provider.district],
    ['Upazila', provider.upazila],
    ['Service areas', provider.serviceAreas?.join(', ')],
    ['Provider registration', provider.registrationNumber],
    ['License number', provider.licenseNumber],
    ['Created', formatDate(provider.createdAt)],
  ]

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Ambulance provider</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{provider.name}</h2>
          </div>
          <div className="flex items-center gap-2">{canUpdate && <Button size="sm" variant="secondary" onClick={onEdit}>Edit provider</Button>}<button type="button" onClick={onClose} aria-label="Close provider details" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3"><StatusBadge status={provider.verificationStatus} /><span className="text-xs text-slate-500">Created {formatDate(provider.createdAt)}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-all text-sm text-slate-200">{value || 'Not provided'}</p></div>)}
        </div>

        {provider.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-widest text-red-300/70">Rejection reason</p><p className="mt-2 text-sm text-slate-300">{provider.verificationReason}</p></div>}

        <section className="mt-7">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Truck size={17} className="text-cyan-300" /> Vehicles</div>
          {provider.vehicles?.length ? <div className="mt-3 space-y-2">{provider.vehicles.map((vehicle, index) => <article key={`${vehicle.registrationNumber}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-100">{vehicle.vehicleType || 'Vehicle'}</h3><p className="mt-1 text-xs text-slate-400">Registration: {vehicle.registrationNumber || 'Not provided'}</p></div><span className="text-xs text-slate-500">Capacity {vehicle.capacity || 'Not provided'}</span></div>{vehicle.equipment?.length > 0 && <p className="mt-3 text-xs leading-5 text-slate-400">Equipment: {vehicle.equipment.join(', ')}</p>}</article>)}</div> : <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No vehicle information is recorded.</p>}
        </section>

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Ambulance size={17} className="text-cyan-300" /> Operational status</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canUpdate ? <>
              <select aria-label="Operational status" value={operationalStatus} onChange={(event) => onOperationalStatusChange(event.target.value)} disabled={provider.verificationStatus === 'SUSPENDED'} className="h-10 min-w-36 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30 disabled:opacity-50">
                {OPERATIONAL_STATUSES.map((status) => <option key={status} value={status} disabled={status !== 'OFFLINE' && provider.verificationStatus !== 'VERIFIED'}>{status}</option>)}
              </select>
              <Button size="sm" disabled={loading || provider.verificationStatus === 'SUSPENDED' || operationalStatus === provider.operationalStatus} onClick={onSaveOperationalStatus}>Update status</Button>
            </> : <StatusBadge status={provider.operationalStatus || 'OFFLINE'} />}
          </div>
          {provider.verificationStatus !== 'VERIFIED' && provider.verificationStatus !== 'SUSPENDED' && <p className="mt-3 text-xs leading-5 text-slate-500">Only verified providers can be marked available or busy.</p>}
          {provider.verificationStatus === 'SUSPENDED' && <p className="mt-3 text-xs leading-5 text-slate-500">Suspended providers remain offline when restored.</p>}
        </section>

        {canVerify && <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck size={17} className="text-cyan-300" /> Verification actions</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {provider.verificationStatus !== 'VERIFIED' && provider.verificationStatus !== 'SUSPENDED' && <Button size="sm" disabled={loading} onClick={() => onAction('verify')}>Verify</Button>}
            {provider.verificationStatus !== 'REJECTED' && provider.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('reject')}>Reject</Button>}
            {provider.verificationStatus === 'SUSPENDED'
              ? <Button size="sm" disabled={loading} onClick={() => onAction('restore')}>Restore</Button>
              : <Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('suspend')}>Suspend</Button>}
          </div>
        </section>}
      </aside>
    </div>
  )
}

function AmbulanceProviderForm({ form, editing, saving, error, onChange, onVehicleChange, onAddVehicle, onRemoveVehicle, onClose, onSubmit }) {
  const fields = [
    ['name', 'Provider name', 'text', 160],
    ['contactPhone', 'Public contact number', 'tel', 30],
    ['address', 'Address (optional)', 'text', 240],
    ['division', 'Division', 'text', 100],
    ['district', 'District', 'text', 120],
    ['upazila', 'Upazila', 'text', 120],
  ]
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm">
      <GlassCard className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Ambulance management</p><h2 className="mt-2 text-2xl font-semibold text-white">{editing ? 'Edit ambulance provider' : 'Add ambulance provider'}</h2><p className="mt-2 text-sm text-slate-400">New providers start pending verification and offline. No dispatch status is created.</p></div><button type="button" onClick={onClose} aria-label="Close ambulance form" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-300/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{error}</p>}
          {fields.map(([name, label, type, maxLength]) => <label key={name}><span className="mb-2 block text-sm font-medium text-slate-200">{label}</span><input name={name} type={type} value={form[name]} onChange={onChange} required={!['address'].includes(name)} maxLength={maxLength} minLength={name === 'name' ? 2 : undefined} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" /></label>)}
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-200">Service areas (comma-separated)</span><input name="serviceAreas" value={form.serviceAreas} onChange={onChange} required maxLength={1000} placeholder="Uttara, Mirpur" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" /></label>
          <div className="sm:col-span-2"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-slate-200">Vehicles</h3><Button type="button" size="sm" variant="secondary" onClick={onAddVehicle}><Plus size={14} />Add vehicle</Button></div>
            <div className="mt-3 space-y-3">{form.vehicles.map((vehicle, index) => <div key={index} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:grid-cols-2">
              <label><span className="mb-2 block text-xs font-medium text-slate-300">Vehicle type</span><input value={vehicle.vehicleType} onChange={(event) => onVehicleChange(index, 'vehicleType', event.target.value)} required maxLength={100} className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/30 px-3 text-sm text-white" /></label>
              <label><span className="mb-2 block text-xs font-medium text-slate-300">Registration / identifier</span><input value={vehicle.registrationNumber} onChange={(event) => onVehicleChange(index, 'registrationNumber', event.target.value)} required maxLength={40} className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/30 px-3 text-sm text-white" /></label>
              <label><span className="mb-2 block text-xs font-medium text-slate-300">Capacity (optional)</span><input type="number" value={vehicle.capacity} onChange={(event) => onVehicleChange(index, 'capacity', event.target.value)} min="1" max="100" step="1" className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/30 px-3 text-sm text-white" /></label>
              <label><span className="mb-2 block text-xs font-medium text-slate-300">Equipment (comma-separated, optional)</span><input value={vehicle.equipment} onChange={(event) => onVehicleChange(index, 'equipment', event.target.value)} maxLength={1000} className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/30 px-3 text-sm text-white" /></label>
              {form.vehicles.length > 1 && <div className="sm:col-span-2"><Button type="button" size="sm" variant="emergency" onClick={() => onRemoveVehicle(index)}>Remove vehicle</Button></div>}
            </div>)}</div>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" icon={false} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add provider'}</Button></div>
        </form>
      </GlassCard>
    </div>
  )
}

function AdminAmbulances() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canVerify = hasPermission('ambulances.verify')
  const canUpdate = hasPermission('ambulances.update')
  const [providers, setProviders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ search: '', verificationStatus: '', serviceArea: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [operationalStatus, setOperationalStatus] = useState('OFFLINE')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_PROVIDER_FORM)
  const [editingProvider, setEditingProvider] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [notice, setNotice] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadProviders = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminAmbulances(accessToken, { ...activeFilters, page, limit: PAGE_SIZE })
      setProviders(result.ambulances)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProviders(1) }, [])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const openDetails = async (provider) => {
    setLoading(true)
    setError('')
    try {
      const details = await getAdminAmbulance(accessToken, provider.id)
      setSelectedProvider(details)
      setOperationalStatus(details.operationalStatus || 'OFFLINE')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const openNewProviderForm = () => {
    setEditingProvider(null)
    setForm(EMPTY_PROVIDER_FORM)
    setError('')
    setFormOpen(true)
  }

  const editSelectedProvider = () => {
    if (!selectedProvider) return
    setEditingProvider(selectedProvider)
    setForm({
      name: selectedProvider.name || '',
      contactPhone: selectedProvider.contactPhone || '',
      address: selectedProvider.address || '',
      division: selectedProvider.division || '',
      district: selectedProvider.district || '',
      upazila: selectedProvider.upazila || '',
      serviceAreas: selectedProvider.serviceAreas?.join(', ') || '',
      vehicles: selectedProvider.vehicles?.length ? selectedProvider.vehicles.map((vehicle) => ({
        vehicleType: vehicle.vehicleType || '',
        registrationNumber: vehicle.registrationNumber || '',
        capacity: vehicle.capacity ?? '',
        equipment: vehicle.equipment?.join(', ') || '',
      })) : EMPTY_PROVIDER_FORM.vehicles,
    })
    setError('')
    setFormOpen(true)
  }

  const updateVehicle = (index, field, value) => setForm((current) => ({
    ...current,
    vehicles: current.vehicles.map((vehicle, vehicleIndex) => vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle),
  }))

  const submitProvider = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    setError('')
    setNotice('')
    const payload = {
      ...form,
      serviceAreas: form.serviceAreas.split(',').map((area) => area.trim()).filter(Boolean),
      vehicles: form.vehicles.map((vehicle) => ({
        ...vehicle,
        capacity: vehicle.capacity === '' ? undefined : Number(vehicle.capacity),
        equipment: vehicle.equipment.split(',').map((item) => item.trim()).filter(Boolean),
      })),
    }
    try {
      if (editingProvider) {
        const updated = await updateAdminAmbulance(accessToken, editingProvider.id, payload)
        setSelectedProvider(updated)
        setOperationalStatus(updated.operationalStatus || 'OFFLINE')
      } else {
        await createAdminAmbulance(accessToken, payload)
      }
      setNotice(editingProvider ? 'Ambulance provider updated.' : 'Ambulance provider added and pending verification.')
      setFormOpen(false)
      setEditingProvider(null)
      await loadProviders(editingProvider ? pagination.page : 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const performAction = async (action, reason = '') => {
    if (!selectedProvider) return
    setLoading(true)
    setError('')
    try {
      const updated = action === 'verify' || action === 'reject'
        ? await updateAdminAmbulanceVerification(accessToken, selectedProvider.id, action === 'verify' ? 'VERIFIED' : 'REJECTED', reason)
        : await updateAdminAmbulanceStatus(accessToken, selectedProvider.id, action === 'suspend' ? 'SUSPENDED' : 'RESTORE')
      setSelectedProvider(updated)
      setOperationalStatus(updated.operationalStatus || 'OFFLINE')
      setProviders((current) => current.map((provider) => provider.id === updated.id ? { ...provider, ...updated } : provider))
      setPendingAction(null)
      setRejectionReason('')
      await loadProviders(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const saveOperationalStatus = async () => {
    if (!selectedProvider) return
    setLoading(true)
    setError('')
    try {
      const updated = await updateAdminAmbulanceOperationalStatus(accessToken, selectedProvider.id, operationalStatus)
      setSelectedProvider(updated)
      setProviders((current) => current.map((provider) => provider.id === updated.id ? { ...provider, ...updated } : provider))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => loadProviders(1)
  const clearFilters = () => {
    const cleared = { search: '', verificationStatus: '', serviceArea: '' }
    setFilters(cleared)
    loadProviders(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Ambulance management" description="Manage providers, vehicles, verification, service areas, and operational status." action={canUpdate ? { label: 'Add provider', icon: Plus, onClick: openNewProviderForm } : undefined} />
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100">{notice}</p>}

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search provider, contact, or vehicle" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="verificationStatus" value={filters.verificationStatus} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All verification statuses</option>{VERIFICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
          <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="serviceArea" value={filters.serviceArea} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by service area" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadProviders(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading ambulance providers" className="mt-6" />}
      {!loading && !error && providers.length === 0 && <div className="mt-6"><EmptyState title="No ambulance providers found" description="No providers match these filters." /></div>}
      {!loading && !error && providers.length > 0 && (
        <GlassCard className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Provider</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Operational</th><th className="px-5 py-4">Service area</th><th className="px-5 py-4">Vehicles</th><th className="px-5 py-4">Action</th></tr></thead>
              <tbody>{providers.map((provider) => <tr key={provider.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(provider)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><Ambulance size={17} /></span><span><span className="block font-medium text-white">{provider.name}</span><span className="block text-xs text-slate-500">{provider.contactPhone || 'No phone provided'}</span></span></button></td><td className="px-5 py-4"><StatusBadge status={provider.verificationStatus} /></td><td className="px-5 py-4"><StatusBadge status={provider.operationalStatus || 'OFFLINE'} /></td><td className="px-5 py-4 text-slate-400">{provider.serviceAreas?.join(', ') || [provider.division, provider.district, provider.upazila].filter(Boolean).join(' / ') || provider.address || '-'}</td><td className="px-5 py-4 text-slate-400">{provider.vehicleCount}</td><td className="px-5 py-4"><Button size="sm" variant="secondary" onClick={() => openDetails(provider)}>View provider</Button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} providers</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadProviders(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadProviders(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
        </GlassCard>
      )}

      <AdminAmbulanceDetails
        provider={pendingAction ? null : selectedProvider}
        loading={loading}
        canVerify={canVerify}
        canUpdate={canUpdate}
        operationalStatus={operationalStatus}
        onOperationalStatusChange={setOperationalStatus}
        onSaveOperationalStatus={saveOperationalStatus}
        onClose={() => setSelectedProvider(null)}
        onAction={(action) => setPendingAction({ action })}
        onEdit={editSelectedProvider}
      />

      {formOpen && <AmbulanceProviderForm
        form={form}
        editing={Boolean(editingProvider)}
        saving={savingProfile}
        error={error}
        onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onVehicleChange={updateVehicle}
        onAddVehicle={() => setForm((current) => ({ ...current, vehicles: [...current.vehicles, { vehicleType: '', registrationNumber: '', capacity: '', equipment: '' }] }))}
        onRemoveVehicle={(index) => setForm((current) => ({ ...current, vehicles: current.vehicles.filter((_, vehicleIndex) => vehicleIndex !== index) }))}
        onClose={() => { setFormOpen(false); setEditingProvider(null) }}
        onSubmit={submitProvider}
      />}

      <ConfirmModal
        open={Boolean(pendingAction && pendingAction.action !== 'reject')}
        onClose={() => setPendingAction(null)}
        onConfirm={() => performAction(pendingAction.action)}
        title={pendingAction?.action === 'verify' ? 'Verify provider?' : pendingAction?.action === 'suspend' ? 'Suspend provider?' : 'Restore provider?'}
        description={pendingAction?.action === 'verify' ? 'This provider will be marked verified. This action is audited.' : pendingAction?.action === 'suspend' ? 'This provider will be suspended and marked offline. This action is audited.' : 'This provider will be restored as verified but remain offline. This action is audited.'}
        confirmText={pendingAction?.action === 'verify' ? 'Verify provider' : pendingAction?.action === 'suspend' ? 'Suspend provider' : 'Restore provider'}
      />

      {pendingAction?.action === 'reject' && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">Reject provider verification</h3><p className="mt-2 text-sm text-slate-400">A reason is required and will be recorded in the audit log.</p><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows="4" className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Enter the rejection reason" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" icon={false} onClick={() => setPendingAction(null)}>Cancel</Button><Button variant="emergency" icon={false} disabled={!rejectionReason.trim() || loading} onClick={() => performAction('reject', rejectionReason)}>Reject provider</Button></div></GlassCard></div>}
    </AdminPageContainer>
  )
}

export default AdminAmbulances
import { useEffect, useState } from 'react'
import { ExternalLink, FileCheck2, Filter, MapPin, Plus, Search, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import {
  getAdminDoctors,
  getAdminDoctor,
  getAdminDoctorCredentialUrl,
  createAdminDoctor,
  updateAdminDoctor,
  updateAdminDoctorStatus,
  updateAdminDoctorVerification,
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
const EMPTY_DOCTOR_FORM = {
  name: '', specialty: '', qualification: '', registrationNumber: '', experienceYears: '',
  hospitalName: '', consultationFee: '', division: '', district: '', upazila: '',
  contactPhone: '', operationalStatus: '',
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function AdminDoctorDetails({ doctor, loading, canVerify, credentialLoading, onClose, onAction, onViewCredential, onEdit }) {
  if (!doctor) return null
  const details = [
    ['Specialty', doctor.specialty],
    ['Qualification', doctor.qualification],
    ['Experience', doctor.experienceYears == null ? '' : `${doctor.experienceYears} years`],
    ['Hospital / clinic', doctor.hospitalName],
    ['Consultation fee', doctor.consultationFee == null ? '' : `${doctor.consultationFee} BDT`],
    ['Availability', doctor.availability],
    ['Contact email', doctor.contactEmail],
    ['Contact phone', doctor.contactPhone],
    ['Address', doctor.address],
    ['Division', doctor.division],
    ['District', doctor.district],
    ['Upazila', doctor.upazila],
    ['Registration number', doctor.registrationNumber],
    ['License number', doctor.licenseNumber],
    ['Created', formatDate(doctor.createdAt)],
  ]

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Doctor profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{doctor.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{doctor.specialty || 'Specialty not provided'}</p>
          </div>
          <div className="flex items-center gap-2">{canVerify && <Button size="sm" variant="secondary" onClick={onEdit}>Edit profile</Button>}<button type="button" onClick={onClose} aria-label="Close doctor profile" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        </div>

        <div className="mt-5 flex items-center gap-3"><StatusBadge status={doctor.verificationStatus} /><span className="text-xs text-slate-500">Created {formatDate(doctor.createdAt)}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-all text-sm text-slate-200">{value || 'Not provided'}</p></div>)}
        </div>

        {doctor.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-widest text-red-300/70">Rejection reason</p><p className="mt-2 text-sm text-slate-300">{doctor.verificationReason}</p></div>}

        <section className="mt-7">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><FileCheck2 size={17} className="text-cyan-300" /> Submitted credentials</div>
          {doctor.submittedCredentials?.length ? (
            <div className="mt-3 space-y-2">
              {doctor.submittedCredentials.map((credential) => (
                <div key={credential.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="min-w-0"><p className="text-sm font-medium text-slate-200">{credential.documentType}</p><p className="mt-1 truncate text-xs text-slate-500">{credential.fileName}</p><p className="mt-2 text-[10px] uppercase tracking-widest text-slate-600">Submitted {formatDate(credential.uploadedAt)}</p></div>
                  <Button size="sm" variant="secondary" disabled={credentialLoading === credential.id} onClick={() => onViewCredential(credential)}><ExternalLink size={14} /> {credentialLoading === credential.id ? 'Opening...' : 'View'}</Button>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No credentials were submitted.</p>}
          <p className="mt-3 text-xs leading-5 text-slate-600">Credential links are private and expire after two minutes. Access is recorded.</p>
        </section>

        {canVerify && <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck size={17} className="text-cyan-300" /> Verification actions</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {doctor.verificationStatus !== 'VERIFIED' && doctor.verificationStatus !== 'SUSPENDED' && <Button size="sm" disabled={loading} onClick={() => onAction('verify')}>Verify</Button>}
            {doctor.verificationStatus !== 'REJECTED' && doctor.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('reject')}>Reject</Button>}
            {doctor.verificationStatus === 'SUSPENDED'
              ? <Button size="sm" disabled={loading} onClick={() => onAction('restore')}>Restore</Button>
              : <Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('suspend')}>Suspend</Button>}
          </div>
        </section>}
      </aside>
    </div>
  )
}

function DoctorProfileForm({ form, editing, saving, error, onChange, onClose, onSubmit }) {
  const textFields = [
    ['name', 'Full name', 'text'],
    ['qualification', 'Qualification', 'text'],
    ['specialty', 'Specialty', 'text'],
    ['registrationNumber', 'BMDC registration number', 'text'],
    ['hospitalName', 'Hospital / clinic', 'text'],
    ['contactPhone', 'Public contact number', 'tel'],
    ['division', 'Division', 'text'],
    ['district', 'District', 'text'],
    ['upazila', 'Upazila', 'text'],
  ]
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm">
      <GlassCard className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Doctor management</p><h2 className="mt-2 text-2xl font-semibold text-white">{editing ? 'Edit doctor profile' : 'Add doctor profile'}</h2><p className="mt-2 text-sm text-slate-400">New profiles remain pending until reviewed by an authorized administrator.</p></div><button type="button" onClick={onClose} aria-label="Close doctor form" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-300/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{error}</p>}
          {textFields.map(([name, label, type]) => <label key={name}><span className="mb-2 block text-sm font-medium text-slate-200">{label}</span><input name={name} type={type} value={form[name]} onChange={onChange} required minLength={name === 'name' ? 2 : name === 'registrationNumber' ? 3 : undefined} maxLength={name === 'name' ? 160 : name === 'qualification' ? 240 : name === 'registrationNumber' ? 120 : name === 'specialty' ? 120 : ['division'].includes(name) ? 100 : 120} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" /></label>)}
          <label><span className="mb-2 block text-sm font-medium text-slate-200">Experience (years)</span><input name="experienceYears" type="number" value={form.experienceYears} onChange={onChange} required min="0" max="80" step="1" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" /></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-200">Consultation fee (BDT)</span><input name="consultationFee" type="number" value={form.consultationFee} onChange={onChange} required min="0" max="1000000" step="1" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" /></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-200">Availability</span><select name="operationalStatus" value={form.operationalStatus} onChange={onChange} required className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">Select availability</option><option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="OFFLINE">Offline</option></select></label>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" icon={false} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add doctor'}</Button></div>
        </form>
      </GlassCard>
    </div>
  )
}

function AdminDoctors() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canVerify = hasPermission('doctors.verify')
  const [doctors, setDoctors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ search: '', specialty: '', verificationStatus: '', location: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [credentialLoading, setCredentialLoading] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_DOCTOR_FORM)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [notice, setNotice] = useState('')

  const loadDoctors = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminDoctors(accessToken, { ...activeFilters, page, limit: PAGE_SIZE })
      setDoctors(result.doctors)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDoctors(1) }, [])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const openDetails = async (doctor) => {
    setLoading(true)
    setError('')
    try {
      setSelectedDoctor(await getAdminDoctor(accessToken, doctor.id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const openNewDoctorForm = () => {
    setEditingDoctor(null)
    setForm(EMPTY_DOCTOR_FORM)
    setError('')
    setFormOpen(true)
  }

  const editSelectedDoctor = () => {
    if (!selectedDoctor) return
    setEditingDoctor(selectedDoctor)
    setForm({
      name: selectedDoctor.name || '',
      specialty: selectedDoctor.specialty || '',
      qualification: selectedDoctor.qualification || '',
      registrationNumber: selectedDoctor.registrationNumber || '',
      experienceYears: selectedDoctor.experienceYears ?? '',
      hospitalName: selectedDoctor.hospitalName || '',
      consultationFee: selectedDoctor.consultationFee ?? '',
      division: selectedDoctor.division || '',
      district: selectedDoctor.district || '',
      upazila: selectedDoctor.upazila || '',
      contactPhone: selectedDoctor.contactPhone || '',
      operationalStatus: selectedDoctor.availability || 'OFFLINE',
    })
    setError('')
    setFormOpen(true)
  }

  const submitDoctor = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
    }
    try {
      if (editingDoctor) {
        const updated = await updateAdminDoctor(accessToken, editingDoctor.id, payload)
        setSelectedDoctor(updated)
      } else {
        await createAdminDoctor(accessToken, payload)
      }
      setNotice(editingDoctor ? 'Doctor profile updated.' : 'Doctor profile added and pending verification.')
      setFormOpen(false)
      setEditingDoctor(null)
      await loadDoctors(editingDoctor ? pagination.page : 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const viewCredential = async (credential) => {
    const openedWindow = window.open('about:blank', '_blank')
    if (!openedWindow) {
      setError('Allow pop-ups to view private credentials.')
      return
    }
    openedWindow.opener = null
    setCredentialLoading(credential.id)
    setError('')
    try {
      const result = await getAdminDoctorCredentialUrl(accessToken, selectedDoctor.id, credential.id)
      openedWindow.location.href = result.url
    } catch (requestError) {
      openedWindow.close()
      setError(requestError.message)
    } finally {
      setCredentialLoading('')
    }
  }

  const performAction = async (action, reason = '') => {
    if (!selectedDoctor) return
    setSaving(true)
    setError('')
    try {
      const updated = action === 'verify' || action === 'reject'
        ? await updateAdminDoctorVerification(accessToken, selectedDoctor.id, action === 'verify' ? 'VERIFIED' : 'REJECTED', reason)
        : await updateAdminDoctorStatus(accessToken, selectedDoctor.id, action === 'suspend' ? 'SUSPENDED' : 'RESTORE')
      setSelectedDoctor(updated)
      setDoctors((current) => current.map((doctor) => doctor.id === updated.id ? { ...doctor, ...updated } : doctor))
      setPendingAction(null)
      setRejectionReason('')
      await loadDoctors(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const applyFilters = () => loadDoctors(1)
  const clearFilters = () => {
    const cleared = { search: '', specialty: '', verificationStatus: '', location: '' }
    setFilters(cleared)
    loadDoctors(1, cleared)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Doctor management" description="Manage doctor profiles, credentials, verification, and account status." action={canVerify ? { label: 'Add doctor', icon: Plus, onClick: openNewDoctorForm } : undefined} />
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100">{notice}</p>}

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search name, contact, license" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <input name="specialty" value={filters.specialty} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by specialty" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300/30" />
          <select name="verificationStatus" value={filters.verificationStatus} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/30"><option value="">All verification statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
          <label className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="location" value={filters.location} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Filter by location" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadDoctors(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading doctors" className="mt-6" />}
      {!loading && !error && doctors.length === 0 && <div className="mt-6"><EmptyState title="No doctors found" description="No doctor records match these filters." /></div>}
      {!loading && !error && doctors.length > 0 && (
        <GlassCard className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Doctor</th><th className="px-5 py-4">Specialty</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Credentials</th><th className="px-5 py-4">Action</th></tr></thead>
              <tbody>{doctors.map((doctor) => <tr key={doctor.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(doctor)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><Stethoscope size={17} /></span><span><span className="block font-medium text-white">{doctor.name}</span><span className="block text-xs text-slate-500">{doctor.contactPhone || doctor.contactEmail || 'No contact provided'}</span></span></button></td><td className="px-5 py-4 text-slate-300">{doctor.specialty || 'Not provided'}</td><td className="px-5 py-4"><StatusBadge status={doctor.verificationStatus} /></td><td className="px-5 py-4 text-slate-400">{[doctor.division, doctor.district, doctor.upazila].filter(Boolean).join(' / ') || doctor.address || '-'}</td><td className="px-5 py-4 text-slate-400">{doctor.credentialCount}</td><td className="px-5 py-4"><Button size="sm" variant="secondary" onClick={() => openDetails(doctor)}>View profile</Button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} doctors</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadDoctors(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadDoctors(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
        </GlassCard>
      )}

      <AdminDoctorDetails
        doctor={pendingAction ? null : selectedDoctor}
        loading={saving}
        canVerify={canVerify}
        credentialLoading={credentialLoading}
        onClose={() => setSelectedDoctor(null)}
        onAction={(action) => setPendingAction({ action })}
        onViewCredential={viewCredential}
        onEdit={editSelectedDoctor}
      />

      {formOpen && <DoctorProfileForm
        form={form}
        editing={Boolean(editingDoctor)}
        saving={saving}
        error={error}
        onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onClose={() => { setFormOpen(false); setEditingDoctor(null) }}
        onSubmit={submitDoctor}
      />}

      <ConfirmModal
        open={Boolean(pendingAction && pendingAction.action !== 'reject')}
        onClose={() => setPendingAction(null)}
        onConfirm={() => performAction(pendingAction.action)}
        title={pendingAction?.action === 'verify' ? 'Verify doctor?' : pendingAction?.action === 'suspend' ? 'Suspend doctor?' : 'Restore doctor?'}
        description={pendingAction?.action === 'verify' ? 'The doctor will be marked verified after backend review. This action is audited.' : pendingAction?.action === 'suspend' ? 'The doctor will be suspended. This action is audited.' : 'The doctor will be restored to verified status. This action is audited.'}
        confirmText={pendingAction?.action === 'verify' ? 'Verify doctor' : pendingAction?.action === 'suspend' ? 'Suspend doctor' : 'Restore doctor'}
      />

      {pendingAction?.action === 'reject' && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><GlassCard className="w-full max-w-md p-5"><h3 className="text-lg font-semibold text-white">Reject doctor verification</h3><p className="mt-2 text-sm text-slate-400">A reason is required and will be recorded in the audit log.</p><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows="4" className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-red-300/30" placeholder="Enter the rejection reason" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" icon={false} onClick={() => setPendingAction(null)}>Cancel</Button><Button variant="emergency" icon={false} disabled={!rejectionReason.trim() || saving} onClick={() => performAction('reject', rejectionReason)}>Reject doctor</Button></div></GlassCard></div>}
    </AdminPageContainer>
  )
}

export default AdminDoctors
import { useEffect, useState } from 'react'
import { Droplets, Filter, MapPin, Plus, Search, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import {
  addAdminBloodDonor,
  getAdminBloodDonor,
  getAdminBloodDonors,
  getAdminBloodDonorPatientAccounts,
  updateAdminBloodDonor,
  updateAdminBloodDonorAvailability,
  updateAdminBloodDonorStatus,
  verifyAdminBloodDonor,
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const AVAILABILITY = ['AVAILABLE', 'UNAVAILABLE']
const PAGE_SIZE = 20
const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  bloodGroup: '',
  division: '',
  district: '',
  upazila: '',
  availability: 'UNAVAILABLE',
  lastDonationDate: '',
  preferredContactMethod: '',
  phoneConsent: false,
  notes: '',
}

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function formatDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function DonorForm({ form, onChange, onClose, onSubmit, saving, editing, verificationStatus, error, donorMode, onDonorModeChange, patientSearch, onPatientSearchChange, patientAccounts, onSearchPatients, searchingPatients, selectedPatientId, onPatientSelect }) {
  const fields = [
    ['name', 'Full name', 'text', true],
    ...(editing && form.email ? [['email', 'Account email', 'email', false]] : []),
    ['phone', 'Contact phone', 'tel', true],
    ['division', 'Division', 'text', true],
    ['district', 'District', 'text', true],
    ['upazila', 'Upazila', 'text', true],
  ]
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <GlassCard className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Blood donor management</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{editing ? 'Edit donor details' : 'Add Blood Donor'}</h2>
            <p className="mt-2 text-sm text-slate-400">{editing ? 'Update this donor profile.' : 'New donors stay pending verification and remain hidden from public search until verified.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close donor form" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-300/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{error}</p>}
          {!editing && <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-slate-200">Donor account</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['EXISTING_PATIENT', 'Select existing patient'],
                ['STANDALONE', 'Create standalone donor'],
              ].map(([mode, label]) => <label key={mode} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200">
                <input type="radio" name="donorMode" value={mode} checked={donorMode === mode} onChange={() => onDonorModeChange(mode)} />
                {label}
              </label>)}
            </div>
          </fieldset>}
          {!editing && donorMode === 'EXISTING_PATIENT' && <>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="patient-search">Search active patients by name or phone</label>
              <div className="flex gap-2">
                <input id="patient-search" value={patientSearch} onChange={onPatientSearchChange} minLength={2} maxLength={100} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" />
                <Button type="button" disabled={searchingPatients || patientSearch.trim().length < 2} onClick={onSearchPatients}>{searchingPatients ? 'Searching...' : 'Search'}</Button>
              </div>
            </div>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-200">Patient account</span>
              <select value={selectedPatientId} onChange={(event) => onPatientSelect(event.target.value)} required className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/40">
                <option value="">Select a patient account</option>
                {patientAccounts.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.phone || 'No phone'}{patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}</option>)}
              </select>
            </label>
          </>}
          {!editing && donorMode === 'STANDALONE' && <p className="sm:col-span-2 text-xs text-slate-400">This creates a donor record without creating sign-in credentials. Existing phone numbers must be linked to their patient account instead.</p>}
          {fields.map(([name, label, type, required]) => <label key={name}>
            <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
            <input name={name} type={type} value={form[name]} onChange={onChange} required={required} readOnly={name === 'phone' && donorMode === 'EXISTING_PATIENT' && Boolean(patientAccounts.find((patient) => patient.id === selectedPatientId)?.phone)} minLength={name === 'name' ? 2 : name === 'phone' ? 7 : undefined} maxLength={name === 'name' ? 100 : name === 'phone' ? 20 : ['division', 'district', 'upazila'].includes(name) ? 100 : 160} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40 read-only:cursor-not-allowed read-only:opacity-70" />
          </label>)}
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-200">Blood group</span>
            <select name="bloodGroup" value={form.bloodGroup} onChange={onChange} required className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/40"><option value="">Select blood group</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-200">Availability status</span>
            <select name="availability" value={form.availability} onChange={onChange} required className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none focus:border-cyan-300/40"><option value="UNAVAILABLE">Unavailable</option><option value="AVAILABLE" disabled={['REJECTED', 'SUSPENDED'].includes(verificationStatus)}>Available</option></select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-200">Last donation date (optional)</span>
            <input name="lastDonationDate" type="date" max={new Date().toISOString().slice(0, 10)} value={form.lastDonationDate} onChange={onChange} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 text-sm text-white outline-none focus:border-cyan-300/40" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-200">Preferred contact (optional)</span>
            <select name="preferredContactMethod" value={form.preferredContactMethod} onChange={onChange} className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">Not specified</option><option value="PHONE">Phone call</option><option value="SMS">SMS</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></select>
          </label>
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
            <input name="phoneConsent" type="checkbox" checked={form.phoneConsent} onChange={onChange} className="h-4 w-4 accent-cyan-300" />
            Donor explicitly consented to share their phone number with blood seekers
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Additional notes (optional)</span>
            <textarea name="notes" value={form.notes} onChange={onChange} maxLength={1000} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40" />
          </label>
          <div className="flex items-end justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" icon={false} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add Blood Donor'}</Button></div>
        </form>
      </GlassCard>
    </div>
  )
}

function DonorDetails({ donor, loading, canModerate, availability, onAvailabilityChange, onSaveAvailability, onClose, onEdit, onAction }) {
  if (!donor) return null
  const details = [
    ['Blood group', donor.bloodGroup],
    ['Contact phone', donor.phone],
    ['Account email', donor.email],
    ['Division', donor.location?.division],
    ['District', donor.location?.district],
    ['Upazila', donor.location?.upazila],
    ['Last donation', formatDate(donor.lastDonationDate)],
    ['Preferred contact', donor.preferredContactMethod],
    ['Created', formatDate(donor.createdAt)],
    ['Updated', formatDate(donor.updatedAt)],
  ]
  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Donor profile</p><h2 className="mt-2 text-2xl font-semibold text-white">{donor.name}</h2></div><div className="flex items-center gap-2">{canModerate && <Button size="sm" variant="secondary" onClick={onEdit}>Edit details</Button>}<button type="button" onClick={onClose} aria-label="Close donor profile" className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"><X size={18} /></button></div></div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><StatusBadge status={donor.verificationStatus} /><span className="text-xs text-slate-500">Added {formatDate(donor.createdAt)}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 break-all text-sm text-slate-200">{value || 'Not provided'}</p></div>)}</div>
        {donor.verificationReason && <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4"><p className="text-[10px] uppercase tracking-widest text-red-300/70">Verification note</p><p className="mt-2 text-sm text-slate-300">{donor.verificationReason}</p></div>}

        {donor.notes && <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Additional notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{donor.notes}</p></div>}
        {canModerate && <>
          <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-2 text-sm font-medium text-white"><Droplets size={17} className="text-rose-300" /> Availability</div><div className="mt-4 flex flex-wrap items-center gap-2"><select aria-label="Donor availability" value={availability} onChange={(event) => onAvailabilityChange(event.target.value)} disabled={['REJECTED', 'SUSPENDED'].includes(donor.verificationStatus)} className="h-10 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none disabled:opacity-50">{AVAILABILITY.map((status) => <option key={status} value={status} disabled={status === 'AVAILABLE' && ['REJECTED', 'SUSPENDED'].includes(donor.verificationStatus)}>{status}</option>)}</select><Button size="sm" disabled={loading || ['REJECTED', 'SUSPENDED'].includes(donor.verificationStatus) || availability === donor.availability} onClick={onSaveAvailability}>Update availability</Button></div>{donor.verificationStatus === 'PENDING' && <p className="mt-3 text-xs leading-5 text-slate-500">Pending donors stay hidden from public search until verified.</p>}</section>
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck size={17} className="text-cyan-300" /> Donor actions</div><div className="mt-4 flex flex-wrap gap-2">{donor.verificationStatus === 'PENDING' && <><Button size="sm" disabled={loading} onClick={() => onAction('verify')}>Verify donor</Button><Button size="sm" variant="emergency" disabled={loading} onClick={() => onAction('reject')}>Reject verification</Button></>}{donor.verificationStatus !== 'SUSPENDED' && <Button size="sm" variant="secondary" disabled={loading} onClick={() => onAction('suspend')}>Suspend donor</Button>}{donor.verificationStatus === 'SUSPENDED' && <Button size="sm" disabled={loading} onClick={() => onAction('restore')}>Restore donor</Button>}</div></section>
        </>}
        <p className="mt-6 text-xs leading-5 text-slate-600">Only donor contact details needed for administration are shown here.</p>
      </aside>
    </div>
  )
}

function AdminBloodDonors() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const canModerate = hasPermission('blood.moderate')
  const [donors, setDonors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ search: '', bloodGroup: '', division: '', district: '', upazila: '', availability: '', verificationStatus: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [availability, setAvailability] = useState('UNAVAILABLE')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [donorMode, setDonorMode] = useState('EXISTING_PATIENT')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientAccounts, setPatientAccounts] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [editingDonor, setEditingDonor] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [notice, setNotice] = useState('')

  const loadDonors = async (page = 1, activeFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getAdminBloodDonors(accessToken, { ...activeFilters, page, limit: PAGE_SIZE })
      setDonors(result.donors)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDonors(1) }, [])

  const openDetails = async (donor) => {
    setLoading(true)
    setError('')
    try {
      const details = await getAdminBloodDonor(accessToken, donor.id)
      setSelectedDonor(details)
      setAvailability(details.availability)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const searchPatientAccounts = async () => {
    if (patientSearch.trim().length < 2) return
    setSearchingPatients(true)
    setError('')
    try {
      const result = await getAdminBloodDonorPatientAccounts(accessToken, patientSearch.trim())
      setPatientAccounts(result.patients)
      if (selectedPatientId && !result.patients.some((patient) => patient.id === selectedPatientId)) {
        setSelectedPatientId('')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSearchingPatients(false)
    }
  }

  const selectPatientAccount = (patientId) => {
    setSelectedPatientId(patientId)
    const patient = patientAccounts.find((account) => account.id === patientId)
    if (patient) {
      setForm((current) => ({
        ...current,
        name: patient.name,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup || current.bloodGroup,
      }))
    }
  }

  const submitDonor = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      name: form.name,
      phone: form.phone,
      bloodGroup: form.bloodGroup,
      availability: form.availability,
      location: { division: form.division, district: form.district, upazila: form.upazila },
      lastDonationDate: form.lastDonationDate,
      preferredContactMethod: form.preferredContactMethod,
      phoneConsent: form.phoneConsent,
      notes: form.notes,
    }
    if (editingDonor) payload.email = form.email
    else {
      payload.accountMode = donorMode
      if (donorMode === 'EXISTING_PATIENT') payload.patientAccountId = selectedPatientId
    }
    try {
      if (editingDonor) {
        const updated = await updateAdminBloodDonor(accessToken, editingDonor.id, payload)
        setSelectedDonor(updated)
        setAvailability(updated.availability)
      } else {
        await addAdminBloodDonor(accessToken, payload)
      }
      setNotice(editingDonor ? 'Donor details updated.' : 'Donor added successfully.')
      setFormOpen(false)
      setEditingDonor(null)
      setForm(EMPTY_FORM)
      await loadDonors(editingDonor ? pagination.page : 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const performAction = async (action) => {
    if (!selectedDonor) return
    setSaving(true)
    setError('')
    try {
      const updated = action === 'verify' || action === 'reject'
        ? await verifyAdminBloodDonor(accessToken, selectedDonor.id, action === 'reject'
          ? { status: 'REJECTED', reason: rejectReason }
          : { status: 'VERIFIED' })
        : await updateAdminBloodDonorStatus(accessToken, selectedDonor.id, action === 'suspend' ? 'SUSPEND' : 'RESTORE')
      setSelectedDonor(updated)
      setAvailability(updated.availability)
      setDonors((current) => current.map((donor) => donor.id === updated.id ? { ...donor, ...updated } : donor))
      setPendingAction(null)
      setRejectReason('')
      setNotice(action === 'reject' ? 'Donor verification rejected.' : action === 'verify' ? 'Donor verified.' : action === 'suspend' ? 'Donor suspended.' : 'Donor restored.')
      await loadDonors(pagination.page)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const saveAvailability = async () => {
    if (!selectedDonor) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await updateAdminBloodDonorAvailability(accessToken, selectedDonor.id, availability)
      setSelectedDonor(updated)
      setDonors((current) => current.map((donor) => donor.id === updated.id ? { ...donor, ...updated } : donor))
      setNotice('Availability updated.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const applyFilters = () => loadDonors(1)
  const clearFilters = () => {
    const cleared = { search: '', bloodGroup: '', division: '', district: '', upazila: '', availability: '', verificationStatus: '' }
    setFilters(cleared)
    loadDonors(1, cleared)
  }

  const editSelectedDonor = () => {
    if (!selectedDonor) return
    setEditingDonor(selectedDonor)
    setForm({
      name: selectedDonor.name || '',
      email: selectedDonor.email || '',
      phone: selectedDonor.phone || '',
      bloodGroup: selectedDonor.bloodGroup || '',
      division: selectedDonor.location?.division || '',
      district: selectedDonor.location?.district || '',
      upazila: selectedDonor.location?.upazila || '',
      availability: selectedDonor.availability || 'UNAVAILABLE',
      lastDonationDate: formatDateInput(selectedDonor.lastDonationDate),
      preferredContactMethod: selectedDonor.preferredContactMethod || '',
      phoneConsent: selectedDonor.phoneConsent === true,
      notes: selectedDonor.notes || '',
    })
    setFormOpen(true)
  }

  const openAddDonorForm = () => {
    setEditingDonor(null)
    setForm(EMPTY_FORM)
    setDonorMode('EXISTING_PATIENT')
    setPatientSearch('')
    setPatientAccounts([])
    setSelectedPatientId('')
    setError('')
    setFormOpen(true)
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader title="Blood donor management" description="Manage donor accounts, blood groups, availability, and verification." action={canModerate ? { label: 'Add Blood Donor', icon: Plus, onClick: openAddDonorForm } : undefined} />
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100">{notice}</p>}

      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Filter size={16} className="text-cyan-300" /> Donor filters</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name="search" value={filters.search} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Search donor or location" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-300/30" /></label>
          <select name="bloodGroup" value={filters.bloodGroup} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All blood groups</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
          <select name="availability" value={filters.availability} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All availability</option>{AVAILABILITY.map((status) => <option key={status}>{status}</option>)}</select>
          <select name="verificationStatus" value={filters.verificationStatus} onChange={updateFilter} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none"><option value="">All verification statuses</option>{['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].map((status) => <option key={status}>{status}</option>)}</select>
          {['division', 'district', 'upazila'].map((field) => <label key={field} className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input name={field} value={filters[field]} onChange={updateFilter} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder={field[0].toUpperCase() + field.slice(1)} className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none" /></label>)}
          <div className="flex gap-2 md:col-span-2"><Button onClick={applyFilters} className="flex-1"><Search size={15} /> Apply filters</Button><Button variant="secondary" icon={false} onClick={clearFilters}>Clear</Button></div>
        </div>
      </GlassCard>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={() => loadDonors(pagination.page)} /></div>}
      {loading && <LoadingState label="Loading blood donors" className="mt-6" />}
      {!loading && !error && donors.length === 0 && <div className="mt-6"><EmptyState icon={Droplets} title="No donors found" description="No donor accounts match these filters." /></div>}
      {!loading && !error && donors.length > 0 && <GlassCard className="mt-6 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-widest text-slate-500"><tr><th className="px-5 py-4">Donor</th><th className="px-5 py-4">Blood group</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Availability</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Action</th></tr></thead><tbody>{donors.map((donor) => <tr key={donor.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><button type="button" onClick={() => openDetails(donor)} className="flex items-center gap-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-400/10 text-rose-200"><Droplets size={17} /></span><span className="font-medium text-white">{donor.name}</span></button></td><td className="px-5 py-4 font-semibold text-white">{donor.bloodGroup}</td><td className="px-5 py-4"><StatusBadge status={donor.verificationStatus} /></td><td className="px-5 py-4"><StatusBadge status={donor.availability} /></td><td className="px-5 py-4 text-slate-400">{[donor.location?.division, donor.location?.district, donor.location?.upazila].filter(Boolean).join(' / ') || '-'}</td><td className="px-5 py-4"><Button size="sm" variant="secondary" onClick={() => openDetails(donor)}>View donor</Button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><p className="text-xs text-slate-500">{pagination.total} donors</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1 || loading} onClick={() => loadDonors(pagination.page - 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadDonors(pagination.page + 1)} className="rounded-full border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div></GlassCard>}

      <DonorDetails donor={pendingAction ? null : selectedDonor} loading={loading || saving} canModerate={canModerate} availability={availability} onAvailabilityChange={setAvailability} onSaveAvailability={saveAvailability} onClose={() => setSelectedDonor(null)} onEdit={editSelectedDonor} onAction={(action) => { setError(''); setPendingAction({ action }) }} />
      <ConfirmModal open={Boolean(pendingAction && pendingAction.action !== 'reject')} onClose={() => setPendingAction(null)} onConfirm={() => performAction(pendingAction.action)} title={pendingAction?.action === 'verify' ? 'Verify donor?' : pendingAction?.action === 'suspend' ? 'Suspend donor?' : 'Restore donor?'} description={pendingAction?.action === 'verify' ? 'This donor will be marked verified. This action is audited.' : pendingAction?.action === 'suspend' ? 'This donor will be suspended and marked unavailable. This action is audited.' : 'This donor will be restored to the previous verification state and remain unavailable. This action is audited.'} confirmText={pendingAction?.action === 'verify' ? 'Verify donor' : pendingAction?.action === 'suspend' ? 'Suspend donor' : 'Restore donor'} />
      {pendingAction?.action === 'reject' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); performAction('reject') }} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl"><h2 className="text-xl font-semibold text-white">Reject donor verification</h2><p className="mt-2 text-sm text-slate-400">Provide a reason for the audit record and donor profile.</p>{error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}<textarea autoFocus required minLength={3} maxLength={500} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-cyan-300/40" /><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="secondary" icon={false} onClick={() => setPendingAction(null)}>Cancel</Button><Button type="submit" variant="emergency" disabled={saving}>{saving ? 'Saving...' : 'Reject verification'}</Button></div></form></div>}
      {formOpen && <DonorForm
        form={form}
        onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))}
        onClose={() => { setFormOpen(false); setEditingDonor(null); setSelectedPatientId('') }}
        onSubmit={submitDonor}
        saving={saving}
        editing={Boolean(editingDonor)}
        verificationStatus={editingDonor?.verificationStatus}
        error={error}
        donorMode={donorMode}
        onDonorModeChange={(mode) => { setDonorMode(mode); setSelectedPatientId('') }}
        patientSearch={patientSearch}
        onPatientSearchChange={(event) => setPatientSearch(event.target.value)}
        patientAccounts={patientAccounts}
        onSearchPatients={searchPatientAccounts}
        searchingPatients={searchingPatients}
        selectedPatientId={selectedPatientId}
        onPatientSelect={selectPatientAccount}
      />}
    </AdminPageContainer>
  )
}

export default AdminBloodDonors
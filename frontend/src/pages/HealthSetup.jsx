import {
  Activity,
  CalendarDays,
  ChevronDown,
  FileText,
  HeartPulse,
  Hospital,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  deleteTimelineEntry,
  getHealthProfile,
  getHealthTimeline,
  saveHealthProfile,
  saveTimelineEntry,
} from '../services/api'

const recordSections = [
  {
    type: 'MEDICAL_RECORD',
    title: 'Medical Records',
    shortTitle: 'Records',
    icon: FileText,
    fields: [
      { name: 'title', label: 'Record title', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Short description', type: 'textarea', required: true },
    ],
  },
  {
    type: 'PRESCRIPTION',
    title: 'Prescriptions',
    shortTitle: 'Prescriptions',
    icon: Pill,
    fields: [
      { name: 'medicine', label: 'Medicine name', required: true },
      { name: 'doctor', label: 'Doctor name', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    type: 'REPORT',
    title: 'Reports',
    shortTitle: 'Reports',
    icon: Activity,
    fields: [
      { name: 'name', label: 'Report name or type', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'notes', label: 'Result or notes', type: 'textarea' },
    ],
  },
  {
    type: 'DOCTOR_VISIT',
    title: 'Doctor Visits',
    shortTitle: 'Doctor visits',
    icon: Stethoscope,
    fields: [
      { name: 'doctor', label: 'Doctor name', required: true },
      { name: 'specialty', label: 'Specialty', required: true },
      { name: 'date', label: 'Visit date', type: 'date', required: true },
      { name: 'reason', label: 'Reason', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'followUpDate', label: 'Follow-up date', type: 'date' },
    ],
  },
  {
    type: 'HOSPITAL_VISIT',
    title: 'Hospital Visits',
    shortTitle: 'Hospital visits',
    icon: Hospital,
    fields: [
      { name: 'hospital', label: 'Hospital name', required: true },
      { name: 'date', label: 'Visit or admission date', type: 'date', required: true },
      { name: 'reason', label: 'Reason', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    type: 'VACCINATION',
    title: 'Vaccinations',
    shortTitle: 'Vaccinations',
    icon: Syringe,
    fields: [
      { name: 'name', label: 'Vaccine name', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'dose', label: 'Dose (e.g. 1 of 2)' },
      { name: 'provider', label: 'Vaccination provider / center' },
      { name: 'nextDose', label: 'Next dose date', type: 'date' },
    ],
  },
]

const emptyRecordForm = {
  title: '',
  date: '',
  description: '',
  medicine: '',
  doctor: '',
  notes: '',
  name: '',
  specialty: '',
  reason: '',
  hospital: '',
  nextDose: '',
  dose: '',
  provider: '',
  followUpDate: '',
}

function HealthSetup() {
  const { accessToken, user } = useAuth()
  const { addToast } = useToast()
  const [profile, setProfile] = useState({
    bloodGroup: '',
    allergies: '',
    existingConditions: '',
    currentMedications: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
  })
  const [profileExists, setProfileExists] = useState(false)
  const [records, setRecords] = useState([])
  const [recordType, setRecordType] = useState('MEDICAL_RECORD')
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [recordFormOpen, setRecordFormOpen] = useState(false)
  const [recordForm, setRecordForm] = useState(emptyRecordForm)
  const [openSection, setOpenSection] = useState('MEDICAL_RECORD')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const recordSectionsByType = useMemo(
    () => Object.fromEntries(recordSections.map((section) => [section.type, section])),
    [],
  )

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const [profileData, timelineData] = await Promise.all([
          getHealthProfile(accessToken),
          getHealthTimeline(accessToken),
        ])

        if (!active) return

        if (profileData) {
          setProfileExists(true)
          setProfile({
            bloodGroup: profileData.bloodGroup || '',
            allergies: profileData.allergies.join(', '),
            existingConditions: profileData.existingConditions.join(', '),
            currentMedications: profileData.currentMedications.join(', '),
            emergencyContact: {
              name: profileData.emergencyContact?.name || '',
              relationship: profileData.emergencyContact?.relationship || '',
              phone: profileData.emergencyContact?.phone || '',
            },
          })
        }
        setRecords(timelineData || [])
      } catch (error) {
        if (active) addToast({ type: 'error', title: 'Unable to load health data', message: error.message })
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [accessToken, addToast])

  const updateProfile = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateEmergencyContact = (field, value) => {
    setProfile((current) => ({
      ...current,
      emergencyContact: { ...current.emergencyContact, [field]: value },
    }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        bloodGroup: profile.bloodGroup.trim(),
        allergies: profile.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        existingConditions: profile.existingConditions.split(',').map((item) => item.trim()).filter(Boolean),
        currentMedications: profile.currentMedications.split(',').map((item) => item.trim()).filter(Boolean),
        emergencyContact: {
          name: profile.emergencyContact.name.trim(),
          relationship: profile.emergencyContact.relationship.trim(),
          phone: profile.emergencyContact.phone.trim(),
        },
      }
      await saveHealthProfile(accessToken, payload, profileExists)
      setProfileExists(true)
      addToast({ type: 'success', title: 'Health information saved', message: 'Your health information is now up to date.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Unable to save health information', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const openRecordForm = (type, record = null) => {
    setRecordType(type)
    setEditingRecordId(record?.id || null)
    setRecordForm({
      ...emptyRecordForm,
      ...(record && {
        title: record.title,
        date: record.date.slice(0, 10),
        description: record.description || '',
        ...record.details,
      }),
    })
    setRecordFormOpen(true)
    setOpenSection(type)
  }

  const updateRecordForm = (field, value) => {
    setRecordForm((current) => ({ ...current, [field]: value }))
  }

  const saveRecord = async (event) => {
    event.preventDefault()
    const section = recordSectionsByType[recordType]
    const details = Object.fromEntries(
      section.fields.filter((field) => !['title', 'date', 'description'].includes(field.name)).map((field) => [field.name, recordForm[field.name] || '']),
    )
    const payload = {
      type: {
        MEDICAL_RECORD: 'DIAGNOSIS',
        PRESCRIPTION: 'MEDICATION',
        REPORT: 'OTHER',
        DOCTOR_VISIT: 'VISIT',
        HOSPITAL_VISIT: 'HOSPITALIZATION',
        VACCINATION: 'VACCINATION',
      }[recordType],
      recordType,
      title: (recordForm.title || recordForm.doctor || recordForm.hospital || recordForm.name || recordForm.medicine || '').trim(),
      description: recordForm.description.trim(),
      details,
      date: recordForm.date,
    }

    if (!payload.title || !payload.date) {
      addToast({ type: 'error', title: 'Missing information', message: 'Add a title and date before saving.' })
      return
    }

    setSaving(true)
    try {
      if (editingRecordId) {
        await saveTimelineEntry(accessToken, editingRecordId, payload)
        setRecords((current) => current.map((record) => record.id === editingRecordId ? { ...record, ...payload, date: payload.date } : record))
        addToast({ type: 'success', title: 'Record updated', message: 'The record was updated successfully.' })
      } else {
        const saved = await saveTimelineEntry(accessToken, null, payload)
        setRecords((current) => [saved, ...current])
        addToast({ type: 'success', title: 'Record added', message: 'The new record was saved successfully.' })
      }
      setEditingRecordId(null)
      setRecordFormOpen(false)
      setRecordForm(emptyRecordForm)
    } catch (error) {
      addToast({ type: 'error', title: 'Unable to save record', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete ${record.title}? This cannot be undone.`)) return

    try {
      await deleteTimelineEntry(accessToken, record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      addToast({ type: 'success', title: 'Record deleted', message: 'The record was deleted successfully.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Unable to delete record', message: error.message })
    }
  }

  const toggleSection = (type) => {
    setOpenSection((current) => current === type ? null : type)
  }

  const currentSection = recordSectionsByType[recordType]
  const currentRecords = records.filter((record) => record.recordType === recordType)

  return (
    <div className="space-y-6 py-4">
      <GlassCard className="overflow-hidden border-cyan-300/20 bg-[linear-gradient(135deg,rgba(14,116,144,0.20),rgba(15,23,42,0.8),rgba(12,74,110,0.2))] p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              <ShieldCheck size={12} /> Private Health Information
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">Health Setup</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">Manage your essential health information securely and privately.</p>
          </div>
          <Link to="/health" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10">Back to Health</Link>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-8 text-center text-slate-300">Loading your health information…</GlassCard>
      ) : (
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100"><HeartPulse size={18} /></div>
              <div>
                <h2 className="text-xl font-bold text-white">Basic Health Information</h2>
                <p className="text-sm text-slate-300">Your essentials are stored only for your account.</p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Blood group</span>
                <select value={profile.bloodGroup} onChange={(event) => updateProfile('bloodGroup', event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50">
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bloodGroup) => <option key={bloodGroup}>{bloodGroup}</option>)}
                </select>
              </label>
              <label className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Allergies</span>
                <input value={profile.allergies} onChange={(event) => updateProfile('allergies', event.target.value)} placeholder="Example: Penicillin, Latex" className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
              </label>
              <label className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Existing conditions</span>
                <input value={profile.existingConditions} onChange={(event) => updateProfile('existingConditions', event.target.value)} placeholder="Separate with commas" className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
              </label>
              <label className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Current medications</span>
                <input value={profile.currentMedications} onChange={(event) => updateProfile('currentMedications', event.target.value)} placeholder="Separate with commas" className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
              </label>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4 lg:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"><UserRound size={14} /> Emergency contact</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input value={profile.emergencyContact.name} onChange={(event) => updateEmergencyContact('name', event.target.value)} placeholder="Name" className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                  <input value={profile.emergencyContact.relationship} onChange={(event) => updateEmergencyContact('relationship', event.target.value)} placeholder="Relationship" className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                  <input value={profile.emergencyContact.phone} onChange={(event) => updateEmergencyContact('phone', event.target.value)} placeholder="Phone number" className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                </div>
              </div>
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save Basic Information'}</button>
              </div>
            </form>
          </GlassCard>

          <div className="space-y-4">
            {recordSections.map((section) => {
              const Icon = section.icon
              const isOpen = openSection === section.type
              const sectionRecords = records.filter((record) => record.recordType === section.type)

              return (
                <GlassCard key={section.type} className="overflow-hidden">
                  <button type="button" onClick={() => toggleSection(section.type)} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2.5 text-cyan-100"><Icon size={18} /></div>
                      <div><h2 className="text-lg font-bold text-white">{section.title}</h2><p className="text-xs text-slate-300">{sectionRecords.length} saved {sectionRecords.length === 1 ? 'record' : 'records'}</p></div>
                    </div>
                    <ChevronDown size={18} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-5 py-5 sm:px-6">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-300">Add or edit your {section.shortTitle.toLowerCase()}.</p>
                        <button type="button" onClick={() => openRecordForm(section.type)} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100"><Plus size={13} /> Add record</button>
                      </div>

                      {sectionRecords.length > 0 && (
                        <div className="mb-5 space-y-3">
                          {sectionRecords.map((record) => (
                            <div key={record.id} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                              <div className="min-w-0"><h3 className="truncate font-semibold text-white">{record.title}</h3><p className="mt-1 text-xs text-slate-300">{new Date(record.date).toLocaleDateString()}</p></div>
                              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => openRecordForm(section.type, record)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Edit</button><button type="button" onClick={() => removeRecord(record)} className="rounded-full border border-red-300/20 bg-red-500/10 p-2 text-red-100" aria-label={`Delete ${record.title}`}><Trash2 size={13} /></button></div>
                            </div>
                          ))}
                        </div>
                      )}

                      {recordFormOpen && (
                        <form onSubmit={saveRecord} className="grid gap-3 sm:grid-cols-2">
                          {section.fields.map((field) => (
                            <label key={field.name} className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">
                              {field.label}
                              {field.type === 'textarea' ? (
                                <textarea value={recordForm[field.name]} onChange={(event) => updateRecordForm(field.name, event.target.value)} required={field.required} rows="3" placeholder={field.name === 'description' ? 'Add a short description' : 'Add details'} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                              ) : (
                                <input type={field.type || 'text'} value={recordForm[field.name]} onChange={(event) => updateRecordForm(field.name, event.target.value)} required={field.required} placeholder={field.label} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                              )}
                            </label>
                          ))}
                          <div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-5 py-2.5 text-sm font-medium text-cyan-100 disabled:opacity-60">{saving ? 'Saving…' : editingRecordId ? 'Save Changes' : 'Save Record'}</button>
                            <button type="button" onClick={() => { setEditingRecordId(null); setRecordFormOpen(false); setRecordForm(emptyRecordForm) }} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-200"><X size={14} /> Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>

          <GlassCard className="p-5 text-center text-sm text-slate-300">
            Your health data is private and available only to your authenticated account. <Link to="/health" className="font-semibold text-cyan-100">Return to your health page</Link>.
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export default HealthSetup

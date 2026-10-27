import { useState } from 'react'
import { CalendarDays, Clock3, Eye, PencilLine, Plus, Trash2, X } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import ConfirmModal from '../common/ConfirmModal'

const recordTypes = {
  HEALTH_PROBLEM: {
    label: 'Health problem',
    type: 'OTHER',
    fields: [
      { name: 'title', label: 'Problem title', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'symptoms', label: 'Symptoms', type: 'textarea', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  },
  CURRENT_MEDICINE: {
    label: 'Current medicine',
    type: 'MEDICATION',
    fields: [
      { name: 'title', label: 'Medicine name', required: true },
      { name: 'strength', label: 'Strength', required: true },
      { name: 'instructions', label: 'Prescribed instructions', type: 'textarea', required: true },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'PAUSED', 'COMPLETED'], required: true },
      { name: 'doctorName', label: 'Doctor name (if known)' },
    ],
  },
  DOCTOR_VISIT: {
    label: 'Doctor visit',
    type: 'VISIT',
    fields: [
      { name: 'doctor', label: 'Doctor name', required: true },
      { name: 'specialty', label: 'Specialty', required: true },
      { name: 'date', label: 'Visit date', type: 'date', required: true },
      { name: 'reason', label: 'Reason for visit', required: true },
      { name: 'notes', label: 'Visit notes', type: 'textarea' },
      { name: 'followUpDate', label: 'Follow-up date', type: 'date' },
    ],
  },
  HOSPITAL_VISIT: {
    label: 'Medical / hospital visit',
    type: 'HOSPITALIZATION',
    fields: [
      { name: 'hospital', label: 'Hospital or medical center', required: true },
      { name: 'date', label: 'Visit date', type: 'date', required: true },
      { name: 'reason', label: 'Reason for visit', required: true },
      { name: 'notes', label: 'Visit notes', type: 'textarea' },
    ],
  },
  VACCINATION: {
    label: 'Vaccination',
    type: 'VACCINATION',
    fields: [
      { name: 'name', label: 'Vaccine name', required: true },
      { name: 'date', label: 'Vaccination date', type: 'date', required: true },
      { name: 'dose', label: 'Dose (e.g. 1 of 2)' },
      { name: 'provider', label: 'Vaccination provider / center' },
      { name: 'nextDose', label: 'Next dose date', type: 'date' },
    ],
  },
  DOCTOR_CONSULTATION: {
    label: 'Doctor consultation',
    type: 'VISIT',
    fields: [
      { name: 'doctorName', label: 'Doctor name', required: true },
      { name: 'clinic', label: 'Hospital or clinic', required: true },
      { name: 'date', label: 'Consultation date', type: 'date', required: true },
      { name: 'problem', label: 'Patient problem', type: 'textarea', required: true },
      { name: 'counsellingNotes', label: 'Counselling notes', type: 'textarea' },
      { name: 'followUpDate', label: 'Follow-up date', type: 'date' },
    ],
  },
  CHECKUP_REPORT: {
    label: 'Checkup report',
    type: 'OTHER',
    fields: [
      { name: 'title', label: 'Test name', required: true },
      { name: 'date', label: 'Test date', type: 'date', required: true },
      { name: 'result', label: 'Result', type: 'textarea', required: true },
      { name: 'units', label: 'Units' },
      { name: 'referenceRange', label: 'Reference range' },
      { name: 'laboratory', label: 'Laboratory' },
      { name: 'fileReference', label: 'Secure file', type: 'select-document' },
    ],
  },
}

const detailLabels = {
  symptoms: 'Symptoms',
  doctor: 'Doctor',
  specialty: 'Specialty',
  reason: 'Reason',
  notes: 'Notes',
  followUpDate: 'Follow-up date',
  hospital: 'Hospital / medical center',
  name: 'Vaccine',
  dose: 'Dose',
  provider: 'Provider / center',
  nextDose: 'Next dose date',
  strength: 'Strength',
  instructions: 'Instructions',
  startDate: 'Start date',
  endDate: 'End date',
  status: 'Status',
  doctorName: 'Doctor',
  clinic: 'Hospital / clinic',
  problem: 'Patient problem',
  counsellingNotes: 'Counselling notes',
  result: 'Result',
  units: 'Units',
  referenceRange: 'Reference range',
  laboratory: 'Laboratory',
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300/50'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50'

function emptyForm(recordType) {
  return {
    recordType,
    title: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    details: {},
  }
}

function authorshipLabel(source) {
  return source === 'CLINICIAN_AUTHORED'
    ? 'Clinician-authored information. Verification status has not been provided.'
    : 'Patient-entered. Clinician authorship or verification has not been confirmed.'
}

function MedicalTimeline({
  events,
  documents = [],
  pagination,
  loading = false,
  error = '',
  onSave,
  onDelete,
  onPageChange,
  onDateFilter,
}) {
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [formError, setFormError] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const openNewRecord = () => {
    setEditingId(null)
    setForm(emptyForm('HEALTH_PROBLEM'))
    setFormError('')
  }

  const openEditRecord = (record) => {
    setEditingId(record.id)
    setForm({
      recordType: record.recordType,
      title: record.title || '',
      date: record.date ? record.date.slice(0, 10) : '',
      description: record.description || '',
      details: { ...(record.details || {}) },
    })
    setFormError('')
    setViewing(null)
  }

  const updateFormField = (name, value) => {
    if (name === 'recordType') {
      setForm(emptyForm(value))
      return
    }

    if (['title', 'date', 'description'].includes(name)) {
      setForm((current) => ({ ...current, [name]: value }))
      return
    }
    setForm((current) => ({
      ...current,
      details: { ...current.details, [name]: value },
    }))
  }

  const submitRecord = async (event) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    const config = recordTypes[form.recordType]
    const { recordType, ...record } = form
    const details = { ...record.details }
    if (recordType === 'HEALTH_PROBLEM') {
      record.description = details.description || ''
      delete details.description
    }
    if (recordType === 'CURRENT_MEDICINE') {
      record.date = details.startDate
    }
    if (recordType === 'DOCTOR_CONSULTATION') record.title = `Consultation with ${details.doctorName}`
    if (recordType === 'DOCTOR_VISIT') record.title = `Visit with ${details.doctor}`
    if (recordType === 'HOSPITAL_VISIT') record.title = `Visit to ${details.hospital}`
    if (recordType === 'VACCINATION') record.title = details.name

    const payload = {
      type: config.type,
      recordType,
      title: record.title.trim(),
      description: record.description.trim(),
      details,
      date: record.date,
    }

    try {
      await onSave(editingId, payload)
      setForm(null)
      setEditingId(null)
    } catch (saveError) {
      setFormError(saveError.message || 'Unable to save this record.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleteError('')
    try {
      await onDelete(deleting)
      setDeleting(null)
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message || 'Unable to delete this record.')
    }
  }

  const selectedConfig = form ? recordTypes[form.recordType] : null
  const paginationLabel = pagination?.total
    ? `${pagination.total} record${pagination.total === 1 ? '' : 's'}`
    : 'No records'

  return (
    <section id="medical-timeline" className="scroll-mt-24">
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
              <Clock3 size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Medical timeline</p>
              <h2 className="text-2xl font-bold text-white">Medical timeline</h2>
            </div>
          </div>
          <button type="button" className={buttonClass} onClick={openNewRecord}>
            <Plus size={16} /> Add record
          </button>
        </div>

        <form
          className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            onDateFilter(dateRange)
          }}
        >
          <label className="grid gap-1 text-xs text-slate-300">
            From
            <input type="date" value={dateRange.from} onChange={(event) => setDateRange((range) => ({ ...range, from: event.target.value }))} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs text-slate-300">
            To
            <input type="date" value={dateRange.to} onChange={(event) => setDateRange((range) => ({ ...range, to: event.target.value }))} className={inputClass} />
          </label>
          <button type="submit" className={buttonClass}>Filter dates</button>
          {(dateRange.from || dateRange.to) && (
            <button type="button" onClick={() => { setDateRange({ from: '', to: '' }); onDateFilter({ from: '', to: '' }) }} className="rounded-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{paginationLabel}</span>
        </form>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-300">Loading medical records…</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
            No medical records match these dates. Add a patient-entered record or adjust the date filter.
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-px before:bg-white/10">
            {events.map((event) => {
              const label = recordTypes[event.recordType]?.label || event.recordType?.replaceAll('_', ' ') || 'Medical record'
              return (
                <article key={event.id} className="relative pl-12">
                  <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">
                    <CalendarDays size={14} />
                  </div>
                  <GlassCard className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{new Date(event.date).toLocaleDateString()}</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{event.title}</h3>
                        <p className="mt-1 text-xs font-medium text-cyan-100">{label}</p>
                        {event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{event.description}</p>}
                        <p className="mt-2 text-xs text-amber-100/80">{authorshipLabel(event.source)}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setViewing(event)} aria-label={`View ${event.title}`} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"><Eye size={15} /></button>
                        {recordTypes[event.recordType] && (
                          <button type="button" onClick={() => openEditRecord(event)} aria-label={`Edit ${event.title}`} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"><PencilLine size={15} /></button>
                        )}
                        <button type="button" onClick={() => { setDeleting(event); setDeleteError('') }} aria-label={`Delete ${event.title}`} className="rounded-full border border-red-300/20 bg-red-500/10 p-2 text-red-100 hover:bg-red-500/20"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </GlassCard>
                </article>
              )
            })}
          </div>
        )}

        {pagination?.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button type="button" className={buttonClass} disabled={loading || pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</button>
            <span className="text-sm text-slate-300">Page {pagination.page} of {pagination.totalPages}</span>
            <button type="button" className={buttonClass} disabled={loading || pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>Next</button>
          </div>
        )}
      </GlassCard>

      {form && selectedConfig && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setForm(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="medical-record-form-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/15 bg-slate-950 p-5 shadow-[0_30px_80px_rgba(2,8,23,0.5)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="medical-record-form-title" className="text-xl font-bold text-white">{editingId ? 'Edit medical record' : 'Add medical record'}</h2>
                <p className="mt-1 text-xs text-amber-100/80">This entry will be marked as patient-entered.</p>
              </div>
              <button type="button" onClick={() => setForm(null)} disabled={saving} aria-label="Close form" className="rounded-full p-2 text-slate-300 hover:bg-white/10"><X size={18} /></button>
            </div>
            {!editingId && (
              <label className="mb-4 grid gap-1.5 text-sm text-slate-200">
                Record type
                <select value={form.recordType} onChange={(event) => updateFormField('recordType', event.target.value)} className={inputClass}>
                  {Object.entries(recordTypes).map(([type, config]) => <option value={type} key={type}>{config.label}</option>)}
                </select>
              </label>
            )}
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitRecord}>
              {selectedConfig.fields.map((field) => {
                const isBase = ['title', 'date', 'description'].includes(field.name)
                const value = isBase ? form[field.name] : form.details[field.name] || ''
                const shared = {
                  id: `record-${field.name}`,
                  required: field.required,
                  value,
                  onChange: (event) => updateFormField(field.name, event.target.value),
                  className: inputClass,
                }
                return (
                  <label key={field.name} htmlFor={shared.id} className={`grid gap-1.5 text-sm text-slate-200 ${field.type === 'textarea' || field.type === 'select-document' ? 'sm:col-span-2' : ''}`}>
                    {field.label}
                    {field.type === 'textarea' ? (
                      <textarea {...shared} rows={3} className={`${inputClass} resize-y`} />
                    ) : field.type === 'select' ? (
                      <select {...shared} className={inputClass}>
                        <option value="">Select status</option>
                        {field.options.map((option) => <option key={option} value={option}>{option[0] + option.slice(1).toLowerCase()}</option>)}
                      </select>
                    ) : field.type === 'select-document' ? (
                      <select {...shared} className={inputClass}>
                        <option value="">No secure file linked</option>
                        {documents.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
                      </select>
                    ) : (
                      <input {...shared} type={field.type || 'text'} maxLength={field.type === 'date' ? undefined : 500} />
                    )}
                  </label>
                )
              })}
              {formError && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{formError}</p>}
              <div className="flex justify-end gap-3 pt-1 sm:col-span-2">
                <button type="button" disabled={saving} onClick={() => setForm(null)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={saving} className={buttonClass}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="medical-record-view-title" className="w-full max-w-xl rounded-[28px] border border-white/15 bg-slate-950 p-5 shadow-[0_30px_80px_rgba(2,8,23,0.5)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">{recordTypes[viewing.recordType]?.label || 'Medical record'}</p>
                <h2 id="medical-record-view-title" className="mt-2 text-xl font-bold text-white">{viewing.title}</h2>
                <p className="mt-1 text-sm text-slate-300">{new Date(viewing.date).toLocaleDateString()}</p>
              </div>
              <button type="button" onClick={() => setViewing(null)} aria-label="Close record details" className="rounded-full p-2 text-slate-300 hover:bg-white/10"><X size={18} /></button>
            </div>
            <p className="mt-3 text-xs text-amber-100/80">{authorshipLabel(viewing.source)}</p>
            {viewing.description && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-200">{viewing.description}</p>}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(viewing.details || {}).filter(([key, value]) => value && key !== 'name').map(([key, value]) => {
                if (key === 'fileReference') {
                  const file = documents.find((document) => document.id === value)
                  return file ? <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2"><dt className="text-xs text-slate-400">Secure file</dt><dd className="mt-1 text-sm text-cyan-100">{file.title}</dd></div> : null
                }
                const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
                return <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3"><dt className="text-xs text-slate-400">{detailLabels[key] || key}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{displayValue}</dd></div>
              })}
            </dl>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete medical record?"
        description={deleteError || `Delete "${deleting?.title}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </section>
  )
}

export default MedicalTimeline

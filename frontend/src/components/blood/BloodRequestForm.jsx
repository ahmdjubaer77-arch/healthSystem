import ThemedSelect from '../common/ThemedSelect'
import { AlertCircle, Droplets } from 'lucide-react'
import { useState } from 'react'
import { createBloodRequest } from '../../services/api'
import GlassCard from '../common/GlassCard'
import Button from '../common/Button'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const inputClass = 'h-11 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 text-sm text-[var(--page-text)] outline-none focus:border-[var(--page-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--page-accent)_16%,transparent)]'
const labelClass = 'block text-sm font-medium text-[var(--page-text)]'

function localDateTimeValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function createInitialForm(user) {
  return {
    bloodGroup: user?.bloodGroup || 'A+',
    quantity: '1',
    hospitalName: '',
    division: user?.location?.division || '',
    district: user?.location?.district || '',
    upazila: user?.location?.upazila || '',
    requiredAt: localDateTimeValue(new Date()),
    urgency: 'URGENT',
    contactPerson: user?.name || '',
    contactPhone: user?.phone || '',
    contactPhoneConsent: false,
    notes: '',
  }
}

function BloodRequestForm({ accessToken, user, onCreated }) {
  const [form, setForm] = useState(() => createInitialForm(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSubmitted(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSubmitted(false)
    try {
      const request = await createBloodRequest(accessToken, {
        bloodGroup: form.bloodGroup,
        quantity: Number(form.quantity),
        hospitalName: form.hospitalName,
        division: form.division,
        district: form.district,
        upazila: form.upazila,
        requiredAt: new Date(form.requiredAt).toISOString(),
        urgency: form.urgency,
        contactPhoneConsent: form.contactPhoneConsent,
        ...(form.contactPhoneConsent ? {
          contactPerson: form.contactPerson,
          contactPhone: form.contactPhone,
        } : {}),
        notes: form.notes,
      })
      setSubmitted(true)
      await onCreated?.(request)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-xl bg-[var(--page-surface-sunken)] p-2 text-[var(--page-emergency)]">
          <Droplets size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-[var(--page-muted)]">Blood support</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--page-text)]">Submit a blood request</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          <span className="mb-2 block">Blood group</span>
          <ThemedSelect value={form.bloodGroup} onChange={(event) => update('bloodGroup', event.target.value)} className={inputClass}>
            {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </ThemedSelect>
        </label>

        <label className={labelClass}>
          <span className="mb-2 block">Units required</span>
          <ThemedSelect value={form.quantity} onChange={(event) => update('quantity', event.target.value)} className={inputClass}>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
          </ThemedSelect>
        </label>

        <label className={`${labelClass} md:col-span-2`}>
          <span className="mb-2 block">Hospital or care location</span>
          <input required maxLength={160} value={form.hospitalName} onChange={(event) => update('hospitalName', event.target.value)} className={inputClass} autoComplete="organization" />
        </label>

        {[
          ['division', 'Division', 100],
          ['district', 'District', 120],
          ['upazila', 'Upazila', 120],
        ].map(([field, label, maxLength]) => (
          <label key={field} className={labelClass}>
            <span className="mb-2 block">{label}</span>
            <input maxLength={maxLength} value={form[field]} onChange={(event) => update(field, event.target.value)} className={inputClass} />
          </label>
        ))}

        <label className={labelClass}>
          <span className="mb-2 block">Required by</span>
          <input required type="datetime-local" value={form.requiredAt} min={localDateTimeValue(new Date())} onChange={(event) => update('requiredAt', event.target.value)} className={inputClass} />
        </label>

        <label className={labelClass}>
          <span className="mb-2 block">Urgency</span>
          <ThemedSelect value={form.urgency} onChange={(event) => update('urgency', event.target.value)} className={inputClass}>
            <option value="STANDARD">Standard</option>
            <option value="URGENT">Urgent</option>
            <option value="CRITICAL">Critical</option>
          </ThemedSelect>
        </label>

        <fieldset className="space-y-3 rounded-xl border border-[var(--page-border)] p-4 md:col-span-2">
          <legend className="px-1 text-sm font-medium text-[var(--page-text)]">Contact privacy</legend>
          <label className="flex items-start gap-3 text-sm text-[var(--page-text)]">
            <input type="checkbox" checked={form.contactPhoneConsent} onChange={(event) => update('contactPhoneConsent', event.target.checked)} className="mt-1 accent-[var(--page-accent)]" />
            <span>Display my contact details publicly if this request is verified.</span>
          </label>
          {form.contactPhoneConsent && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="mb-2 block">Contact person</span>
                <input required maxLength={100} value={form.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} className={inputClass} autoComplete="name" />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Contact phone</span>
                <input required type="tel" maxLength={30} value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} className={inputClass} autoComplete="tel" />
              </label>
            </div>
          )}
          <p className="text-xs leading-5 text-[var(--page-muted)]">Contact details stay private unless you explicitly opt in. Requests are not publicly listed until reviewed by an administrator.</p>
        </fieldset>

        <label className={`${labelClass} md:col-span-2`}>
          <span className="mb-2 block">Additional logistics (optional)</span>
          <textarea maxLength={500} rows={3} value={form.notes} onChange={(event) => update('notes', event.target.value)} className="w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 py-2.5 text-sm text-[var(--page-text)] outline-none focus:border-[var(--page-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--page-accent)_16%,transparent)]" />
          <span className="mt-1 block text-xs text-[var(--page-muted)]">Do not include medical history or other sensitive health information.</span>
        </label>

        {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-700 md:col-span-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
        {submitted && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 md:col-span-2">Your request was submitted for verification. It will be publicly listed only after an administrator approves it.</p>}

        <div className="md:col-span-2">
          <Button type="submit" disabled={saving}>
            <Droplets size={15} aria-hidden="true" />
            {saving ? 'Submitting…' : 'Submit for verification'}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}

export default BloodRequestForm

import { AlertTriangle, Droplets } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../common/GlassCard'
import { bloodGroups } from '../../data/bloodMockData'

const defaultForm = {
  patientName: '',
  bloodGroup: 'A+',
  unitsRequired: '2',
  hospital: '',
  division: 'Barishal',
  district: 'Barishal District',
  upazila: 'Barishal Sadar',
  requiredDateTime: '',
  urgency: 'Urgent',
  contactPerson: '',
  contactNumber: '',
  notes: '',
}

function BloodRequestForm() {
  const [form, setForm] = useState(defaultForm)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const requiredFields = [form.patientName, form.hospital, form.contactPerson, form.contactNumber, form.requiredDateTime]
    if (requiredFields.some((item) => !item.trim())) {
      setSubmitted(false)
      return
    }
    setSubmitted(true)
  }

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-2 text-red-100">
          <Droplets size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Create request</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Create a blood request</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Patient name</span>
          <input value={form.patientName} onChange={(event) => handleChange('patientName', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="Sample Patient" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Blood group</span>
          <select value={form.bloodGroup} onChange={(event) => handleChange('bloodGroup', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            {bloodGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Required units</span>
          <select value={form.unitsRequired} onChange={(event) => handleChange('unitsRequired', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            {[1, 2, 3, 4].map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Hospital</span>
          <input value={form.hospital} onChange={(event) => handleChange('hospital', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="Barishal General Hospital" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Division</span>
          <select value={form.division} onChange={(event) => handleChange('division', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option>Barishal</option>
            <option>Dhaka</option>
            <option>Chattogram</option>
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">District</span>
          <select value={form.district} onChange={(event) => handleChange('district', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option>Barishal District</option>
            <option>Dhaka District</option>
            <option>Chattogram District</option>
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Upazila</span>
          <select value={form.upazila} onChange={(event) => handleChange('upazila', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option>Barishal Sadar</option>
            <option>Gournadi</option>
            <option>Uttara</option>
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Required date/time</span>
          <input type="datetime-local" value={form.requiredDateTime} onChange={(event) => handleChange('requiredDateTime', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Urgency</span>
          <select value={form.urgency} onChange={(event) => handleChange('urgency', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option>Normal</option>
            <option>Urgent</option>
            <option>Critical</option>
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Contact person</span>
          <input value={form.contactPerson} onChange={(event) => handleChange('contactPerson', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="Demo Contact" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Contact number</span>
          <input value={form.contactNumber} onChange={(event) => handleChange('contactNumber', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="+8801XXXXXXXXX" />
        </label>

        <label className="md:col-span-2 block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Additional notes</span>
          <textarea value={form.notes} onChange={(event) => handleChange('notes', event.target.value)} rows="4" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="Optional information" />
        </label>

        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70">
            <AlertTriangle size={14} />
            Submit blood request
          </button>
        </div>
      </form>

      {submitted && (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Your blood request was created as a demo.
        </div>
      )}
    </GlassCard>
  )
}

export default BloodRequestForm

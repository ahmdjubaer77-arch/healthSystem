import { AlertTriangle, CalendarRange, CheckCircle2, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../common/GlassCard'

const defaultValues = {
  patientName: '',
  phoneNumber: '',
  preferredDate: '',
  preferredTime: '',
  consultationType: 'In-person',
  hospitalName: '',
  reason: '',
  notes: '',
}

function AppointmentForm({ doctor }) {
  const [values, setValues] = useState(defaultValues)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const requiredValues = [values.patientName, values.phoneNumber, values.preferredDate, values.preferredTime, values.reason]
    if (requiredValues.some((value) => !String(value).trim())) {
      setSubmitted(false)
      return
    }

    setSubmitted(true)
  }

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Appointment request</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Request appointment</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Patient name</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3">
            <UserRound size={14} className="text-cyan-200" />
            <input value={values.patientName} onChange={(event) => handleChange('patientName', event.target.value)} placeholder="Patient name" className="w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none" />
          </div>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Phone number</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3">
            <Phone size={14} className="text-cyan-200" />
            <input value={values.phoneNumber} onChange={(event) => handleChange('phoneNumber', event.target.value)} placeholder="+8801XXXXXXXXX" className="w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none" />
          </div>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Preferred date</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3">
            <CalendarRange size={14} className="text-cyan-200" />
            <input type="date" value={values.preferredDate} onChange={(event) => handleChange('preferredDate', event.target.value)} className="w-full bg-transparent text-white focus:outline-none" />
          </div>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Preferred time</span>
          <input type="time" value={values.preferredTime} onChange={(event) => handleChange('preferredTime', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Consultation type</span>
          <select value={values.consultationType} onChange={(event) => handleChange('consultationType', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option>In-person</option>
            <option>Online</option>
            <option>Both</option>
          </select>
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Hospital / clinic</span>
          <input value={values.hospitalName} onChange={(event) => handleChange('hospitalName', event.target.value)} placeholder={doctor.hospitalName} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="md:col-span-2 block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Reason for visit</span>
          <input value={values.reason} onChange={(event) => handleChange('reason', event.target.value)} placeholder="Checkup / Follow up / Consultation" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="md:col-span-2 block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Additional notes</span>
          <textarea value={values.notes} onChange={(event) => handleChange('notes', event.target.value)} rows="4" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" placeholder="Optional notes" />
        </label>

        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            <AlertTriangle size={16} />
            Your health information should only be shared when necessary.
          </div>

          <button type="submit" className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
            Submit request
          </button>
        </div>
      </form>

      {submitted && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 size={16} />
          <div>
            <div className="font-semibold">Appointment Request Submitted</div>
            <div className="mt-1">This is a frontend prototype. No real appointment has been created.</div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

export default AppointmentForm

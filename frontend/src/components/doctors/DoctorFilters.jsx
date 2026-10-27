import { Filter, RotateCcw } from 'lucide-react'
import GlassCard from '../common/GlassCard'

const textFilters = [
  ['specialty', 'Specialty'],
  ['hospitalName', 'Hospital / clinic'],
  ['division', 'Division'],
  ['district', 'District'],
  ['upazila', 'Upazila'],
]

function DoctorFilters({ filters, onChange, onClear }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Directory filters</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Doctor filters</h2>
        </div>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100">
          <RotateCcw size={14} />Reset
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {textFilters.map(([field, label]) => <label key={field} className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
          <input value={filters[field]} onChange={(event) => onChange(field, event.target.value)} maxLength={120} placeholder={`Any ${label.toLowerCase()}`} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>)}
        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Availability</span>
          <select value={filters.availability} onChange={(event) => onChange('availability', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option value="">Any active status</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-50">
        <Filter size={14} />Availability reflects the doctor profile; contact the clinic to confirm before visiting.
      </div>
    </GlassCard>
  )
}

export default DoctorFilters

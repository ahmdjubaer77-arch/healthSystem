import { Filter, RotateCcw } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function BloodFilters({ availability, onAvailabilityChange, onClear }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Donor filters</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Availability</h2>
        </div>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <RotateCcw size={14} />
          Clear Filters
        </button>
      </div>

      <label className="block max-w-sm text-sm text-slate-200">
        <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Availability status</span>
        <select value={availability} onChange={(event) => onAvailabilityChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="">Any availability</option>
        </select>
      </label>
    </GlassCard>
  )
}

export default BloodFilters

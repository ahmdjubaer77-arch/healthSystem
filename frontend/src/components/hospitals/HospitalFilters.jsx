import { Filter, RotateCcw } from 'lucide-react'
import GlassCard from '../common/GlassCard'

const filterItems = [
  { key: 'emergencyAvailable', label: 'Emergency Available' },
  { key: 'icu', label: 'ICU' },
  { key: 'ccu', label: 'CCU' },
  { key: 'nicu', label: 'NICU' },
  { key: 'bloodBank', label: 'Blood Bank' },
  { key: 'ambulance', label: 'Ambulance' },
  { key: 'government', label: 'Government' },
  { key: 'private', label: 'Private' },
  { key: 'verified', label: 'Verified' },
]

function HospitalFilters({ filters, onToggle, onClear }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Filters</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Hospital filters</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filterItems.map((item) => (
          <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(filters[item.key])}
              onChange={() => onToggle(item.key)}
              className="h-4 w-4 rounded border-slate-400 bg-slate-900 text-cyan-300 focus:ring-cyan-400"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-100">
        <Filter size={14} />
        Use filters to narrow by emergency needs, availability, and verification.
      </div>
    </GlassCard>
  )
}

export default HospitalFilters

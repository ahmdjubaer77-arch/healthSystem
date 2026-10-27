import { Search, X } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function DoctorSearch({ value, onChange, onClear }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-300">Search</span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3">
              <Search size={15} className="text-cyan-200" />
              <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search doctor, specialty or hospital..."
                className="w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

export default DoctorSearch

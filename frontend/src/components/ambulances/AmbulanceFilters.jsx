import { Filter, RotateCcw } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function AmbulanceFilters({ operationalStatus, onStatusChange, onClear }) {
  return (
    <GlassCard className="border-white/[0.08] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-white">Availability</h2><p className="mt-1 text-sm text-slate-400">Filter by provider-reported status.</p></div>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-100 transition hover:border-white/20 hover:bg-white/5 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.16)]"><RotateCcw size={14} />Clear filters</button>
      </div>
      <label className="block max-w-sm text-sm text-slate-200">
        <span className="mb-1.5 block text-xs font-medium text-slate-300">Provider status</span>
        <select value={operationalStatus} onChange={(event) => onStatusChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/20 px-3 py-2.5 text-sm text-white transition-shadow focus:border-white/10 focus:outline-none focus:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.16)]">
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="">Any active status</option>
        </select>
      </label>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs leading-5 text-slate-400"><Filter size={14} className="mt-0.5 shrink-0 text-slate-300" />Provider-reported status is not a dispatch or assignment confirmation.</div>
    </GlassCard>
  )
}

export default AmbulanceFilters

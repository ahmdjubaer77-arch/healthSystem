import { Search } from 'lucide-react'
import GlassCard from '../common/GlassCard'

const fields = [
  ['vehicleType', 'Vehicle type'],
  ['division', 'Division'],
  ['district', 'District'],
  ['upazila', 'Upazila'],
  ['area', 'Service area'],
]

const filterControlClass = 'w-full rounded-xl border border-white/10 bg-slate-950/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 transition-shadow focus:border-white/10 focus:outline-none focus:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.16)]'

function AmbulanceSearch({ query, onQueryChange, filters, onFilterChange }) {
  return (
    <GlassCard className="ambulance-search-page border-white/[0.08] p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div><h2 className="text-base font-semibold text-white">Search providers</h2><p className="mt-1 text-sm text-slate-400">Narrow results by provider, vehicle, or location.</p></div>
        <Search size={18} className="hidden text-slate-500 sm:block" aria-hidden="true" />
      </div>
      <div className="grid items-start gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block text-sm text-slate-200 xl:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-300">Provider or service area</span>
          <div className="ambulance-search-field group flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/20 px-3"><Search size={16} className="shrink-0 text-cyan-200" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} maxLength={120} placeholder="Search provider, vehicle type, or service area" className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none focus-visible:outline-none" /></div>
        </label>
        {fields.map(([field, label]) => <label key={field} className="block text-sm text-slate-200">
          <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
          <input value={filters[field] || ''} onChange={(event) => onFilterChange(field, event.target.value)} maxLength={120} placeholder={`Any ${label.toLowerCase()}`} className={`${filterControlClass} h-11`} />
        </label>)}
      </div>
    </GlassCard>
  )
}

export default AmbulanceSearch

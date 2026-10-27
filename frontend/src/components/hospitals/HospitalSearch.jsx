import { Search } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function HospitalSearch({ query, onQueryChange, filters, onFilterChange }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Search hospital</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Find a hospital</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="md:col-span-2 block text-sm text-slate-200 xl:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Hospital name</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 focus-within:border-cyan-300/50">
            <Search size={16} className="text-cyan-200" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by hospital name or location"
              className="w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </label>

        {[
          { key: 'division', label: 'Division' },
          { key: 'district', label: 'District' },
          { key: 'upazila', label: 'Upazila' },
        ].map((item) => (
          <label key={item.key} className="block text-sm text-slate-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">{item.label}</span>
            <input
              value={filters[item.key] || ''}
              onChange={(event) => onFilterChange(item.key, event.target.value)}
              placeholder={`Filter by ${item.label.toLowerCase()}`}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            />
          </label>
        ))}
      </div>
    </GlassCard>
  )
}

export default HospitalSearch

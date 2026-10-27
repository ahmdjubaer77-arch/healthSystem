import { Search } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function BloodSearch({ search, onSearchChange, location, onLocationChange, onSearch }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Location</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Find a suitable donor</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm text-slate-200 xl:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Search donors and locations</span>
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Name, division, district or upazila" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>
        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Division</span>
          <input value={location.division} onChange={(event) => onLocationChange('division', event.target.value)} maxLength={100} placeholder="Any division" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">District</span>
          <input value={location.district} onChange={(event) => onLocationChange('district', event.target.value)} maxLength={100} placeholder="Any district" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

        <label className="block text-sm text-slate-200">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Upazila</span>
          <input value={location.upazila} onChange={(event) => onLocationChange('upazila', event.target.value)} maxLength={100} placeholder="Any upazila" className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/70" />
        </label>

      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onSearch} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <Search size={14} />
          রক্তদাতা খুঁজুন
        </button>
      </div>
    </GlassCard>
  )
}

export default BloodSearch

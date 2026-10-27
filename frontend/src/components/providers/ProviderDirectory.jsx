import { useMemo, useState } from 'react'
import { providerDirectory } from '../../data/doctorMockData'
import GlassCard from '../common/GlassCard'
import ProviderCard from './ProviderCard'

function ProviderDirectory() {
  const [filter, setFilter] = useState('All')

  const filteredProviders = useMemo(() => {
    if (filter === 'All') return providerDirectory
    return providerDirectory.filter((provider) => provider.providerType === filter)
  }, [filter])

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Provider filters</p>
            <h3 className="mt-2 text-xl font-bold text-white">Filter by provider type</h3>
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white md:max-w-xs focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
            <option value="All">All</option>
            <option value="Hospital">Hospital</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Ambulance Provider">Ambulance Provider</option>
            <option value="Blood Services">Blood Services</option>
          </select>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  )
}

export default ProviderDirectory

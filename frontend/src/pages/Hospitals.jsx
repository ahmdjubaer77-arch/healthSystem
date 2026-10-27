import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import HospitalCard from '../components/hospitals/HospitalCard'
import HospitalSearch from '../components/hospitals/HospitalSearch'
import SectionHeader from '../components/common/SectionHeader'
import { getPublicHospitals } from '../services/api'

const PAGE_SIZE = 20
const defaultFilters = { division: '', district: '', upazila: '' }

function Hospitals() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState(() => Object.fromEntries(Object.keys(defaultFilters).map((field) => [field, searchParams.get(field) || ''])))
  const [hospitals, setHospitals] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHospitals = async (page = 1, search = query, locationFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const result = await getPublicHospitals({ ...locationFilters, search, page, limit: PAGE_SIZE })
      setHospitals(result.hospitals)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHospitals(1) }, [])

  const updateLocationFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => {
    const params = new URLSearchParams({ category: 'hospitals' })
    if (query.trim()) params.set('search', query.trim())
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setSearchParams(params, { replace: true })
    loadHospitals(1)
  }
  const clearFilters = () => {
    setQuery('')
    setFilters(defaultFilters)
    setSearchParams({ category: 'hospitals' }, { replace: true })
    loadHospitals(1, '', defaultFilters)
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Hospital finder"
        title="হাসপাতাল খুঁজুন"
        subtitle="Find Hospitals • Search by name, location, and emergency services."
      />

      <Link to="/hospitals/nearby" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">
        <MapPin size={15} /> Find nearby hospitals
      </Link>

      <HospitalSearch
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFilterChange={updateLocationFilter}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-300">{pagination.total} verified hospital result(s)</div>
        <div className="flex gap-2"><button type="button" onClick={applyFilters} disabled={loading} className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-50">Search hospitals</button><button type="button" onClick={clearFilters} disabled={loading} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-50">Clear</button></div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[28px] border border-white/10 bg-slate-950/20 p-5">
              <div className="h-4 w-24 rounded bg-slate-700/70" />
              <div className="mt-4 h-7 w-2/3 rounded bg-slate-700/70" />
              <div className="mt-4 h-16 rounded bg-slate-700/70" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-300/20 bg-rose-400/[0.04] p-5"><p className="text-sm text-rose-100">{error}</p><button type="button" onClick={applyFilters} className="mt-3 rounded-full border border-rose-300/30 px-4 py-2 text-sm text-rose-100">Retry</button></div>
      ) : hospitals.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-slate-950/20 p-6 text-center">
          <h3 className="text-xl font-semibold text-white">কোনো হাসপাতাল পাওয়া যায়নি</h3>
          <p className="mt-2 text-sm text-slate-300">No verified hospitals match this search.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      )}
      {!loading && !error && pagination.pages > 1 && <div className="flex items-center justify-center gap-4"><button type="button" disabled={pagination.page <= 1} onClick={() => loadHospitals(pagination.page - 1)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-40">Previous</button><span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => loadHospitals(pagination.page + 1)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-40">Next</button></div>}
    </div>
  )
}

export default Hospitals

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ambulance, MapPin, Phone, Truck, X } from 'lucide-react'
import AmbulanceCard from '../components/ambulances/AmbulanceCard'
import AmbulanceFilters from '../components/ambulances/AmbulanceFilters'
import AmbulanceSearch from '../components/ambulances/AmbulanceSearch'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getAmbulanceById, getAmbulances } from '../services/api'

const PAGE_SIZE = 20
const EMPTY_FILTERS = { vehicleType: '', division: '', district: '', upazila: '', area: '', operationalStatus: 'AVAILABLE' }

function AmbulanceDetails({ ambulance, onClose }) {
  if (!ambulance) return null
  const location = [ambulance.upazila, ambulance.district, ambulance.division].filter(Boolean).join(', ')
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <GlassCard className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-wide text-emerald-200">Verified provider</p><h2 className="mt-2 text-xl font-semibold text-white">{ambulance.name}</h2></div><button type="button" onClick={onClose} aria-label="Close ambulance details" className="rounded-full border border-white/10 p-2 text-slate-300"><X size={18} /></button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Provider status</p><p className="mt-2 text-sm text-white">{ambulance.operationalStatus}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Verification</p><p className="mt-2 text-sm text-white">{ambulance.verificationStatus}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-slate-500">Vehicles</p><div className="mt-2 flex items-center gap-2 text-sm text-white"><Truck size={15} />{ambulance.vehicles?.map((vehicle) => vehicle.vehicleType).filter(Boolean).join(', ') || 'Not listed'}</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-slate-500">Service area</p><p className="mt-2 text-sm text-white">{ambulance.serviceAreas?.join(', ') || 'Not provided'}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-slate-500">Location</p><p className="mt-2 flex items-center gap-2 text-sm text-white"><MapPin size={14} />{location || 'Not provided'}</p></div>
        </div>
        <p className="mt-4 text-sm text-slate-400">Operating status is provider-reported; call to confirm. No dispatch or assignment is made by this directory.</p>
        <div className="mt-5 flex gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">Close</button>{ambulance.contactPhone && <a href={`tel:${ambulance.contactPhone}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100"><Phone size={15} />Call</a>}</div>
      </GlassCard>
    </div>
  )
}

function Ambulances() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(() => Object.fromEntries(Object.keys(EMPTY_FILTERS).map((field) => [field, searchParams.get(field) || (field === 'operationalStatus' ? 'AVAILABLE' : '')])))
  const [ambulances, setAmbulances] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedAmbulance, setSelectedAmbulance] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const { area, ...apiFilters } = filters
    getAmbulances({ search: query, ...apiFilters, serviceArea: area, page: pagination.page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return
        setAmbulances(result.ambulances || [])
        setPagination(result.pagination)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, pagination.page, query, reloadKey])

  useEffect(() => {
    const params = new URLSearchParams({ category: 'ambulance' })
    if (query) params.set('search', query)
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setSearchParams(params, { replace: true })
  }, [filters, query, setSearchParams])

  const updateQuery = (value) => {
    setQuery(value)
    setPagination((current) => ({ ...current, page: 1 }))
  }
  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPagination((current) => ({ ...current, page: 1 }))
  }
  const clearFilters = () => {
    setQuery('')
    setFilters({ ...EMPTY_FILTERS, operationalStatus: '' })
    setPagination((current) => ({ ...current, page: 1 }))
    setSearchParams({ category: 'ambulance' }, { replace: true })
  }
  const openDetails = async (ambulance) => {
    setError('')
    try {
      setSelectedAmbulance(await getAmbulanceById(ambulance.id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="space-y-6 py-4">
      <header className="flex items-center justify-between gap-5 border-b border-white/10 pb-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">Emergency transport</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">Ambulance directory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Find verified providers by vehicle type and service area. Call to confirm availability; this directory does not dispatch vehicles.</p>
        </div>
        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200 sm:flex" aria-hidden="true">
          <Ambulance size={27} strokeWidth={1.6} className="ambulance-heading-icon" />
        </div>
      </header>
      <AmbulanceSearch query={query} onQueryChange={updateQuery} filters={filters} onFilterChange={updateFilter} />
      <AmbulanceFilters operationalStatus={filters.operationalStatus} onStatusChange={(value) => updateFilter('operationalStatus', value)} onClear={clearFilters} />
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3"><p className="text-sm text-slate-300"><span className="font-semibold text-white">{pagination.total}</span> verified providers</p><button type="button" onClick={() => setReloadKey((current) => current + 1)} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]">Refresh results</button></div>
      {loading ? <LoadingState label="Loading verified ambulance providers" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} /> : ambulances.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ambulances.map((ambulance) => <AmbulanceCard key={ambulance.id} ambulance={ambulance} onView={openDetails} />)}</div>
      ) : (
        <GlassCard className="p-6 text-center"><h3 className="text-lg font-semibold text-white">No verified providers found</h3><p className="mt-2 text-sm text-slate-300">Try adjusting your search or filters.</p></GlassCard>
      )}
      {!loading && !error && pagination.pages > 1 && <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Next</button></div></div>}
      <AmbulanceDetails ambulance={selectedAmbulance} onClose={() => setSelectedAmbulance(null)} />
    </div>
  )
}

export default Ambulances

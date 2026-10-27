import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DoctorFilters from '../components/doctors/DoctorFilters'
import DoctorGrid from '../components/doctors/DoctorGrid'
import DoctorHero from '../components/doctors/DoctorHero'
import DoctorSafetyNotice from '../components/doctors/DoctorSafetyNotice'
import DoctorSearch from '../components/doctors/DoctorSearch'
import SectionHeader from '../components/common/SectionHeader'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getDoctors } from '../services/api'

const PAGE_SIZE = 20
const EMPTY_FILTERS = {
  search: '',
  specialty: '',
  hospitalName: '',
  division: '',
  district: '',
  upazila: '',
  availability: '',
}

function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => Object.fromEntries(Object.keys(EMPTY_FILTERS).map((field) => [field, searchParams.get(field) || ''])))
  const [doctors, setDoctors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getDoctors({ ...filters, page: pagination.page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return
        setDoctors(result.doctors || [])
        setPagination(result.pagination)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filters, pagination.page, reloadKey])

  useEffect(() => {
    const params = new URLSearchParams({ category: 'doctors' })
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPagination((current) => ({ ...current, page: 1 }))
    setSearchParams({ category: 'doctors' }, { replace: true })
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Doctor directory"
        title="সঠিক চিকিৎসক খুঁজে নিন / Find the Right Doctor"
        subtitle="Search verified, currently available doctors and contact their listed clinic directly."
      />
      <DoctorHero />
      <DoctorSearch value={filters.search} onChange={(value) => updateFilter('search', value)} onClear={() => updateFilter('search', '')} />
      <DoctorFilters filters={filters} onChange={updateFilter} onClear={clearFilters} />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Results</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{pagination.total} doctors</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/20 px-3 py-1.5 text-sm text-slate-200">Verified and active</span>
          </div>
          {loading ? <LoadingState label="Loading doctors" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} /> : doctors.length ? (
            <DoctorGrid doctors={doctors} />
          ) : (
            <GlassCard className="p-6 text-center">
              <h3 className="text-xl font-semibold text-white">No doctors found</h3>
              <p className="mt-2 text-sm text-slate-300">Try changing the search or filters.</p>
            </GlassCard>
          )}
          {!loading && !error && pagination.pages > 1 && <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Next</button></div></div>}
        </div>
        <div className="space-y-4"><DoctorSafetyNotice /></div>
      </div>
    </div>
  )
}

export default Doctors

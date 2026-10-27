import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BloodDonorCard from '../components/blood/BloodDonorCard'
import BloodFilters from '../components/blood/BloodFilters'
import BloodGroupSelector from '../components/blood/BloodGroupSelector'
import BloodHero from '../components/blood/BloodHero'
import BloodMatchingInfo from '../components/blood/BloodMatchingInfo'
import BloodSafetyNotice from '../components/blood/BloodSafetyNotice'
import BloodSearch from '../components/blood/BloodSearch'
import DonorDetails from '../components/blood/DonorDetails'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getBloodDonors } from '../services/api'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const defaultLocation = {
  division: '',
  district: '',
  upazila: '',
}

const PAGE_SIZE = 20

function Blood() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get('bloodGroup') || 'A+')
  const [location, setLocation] = useState(() => Object.fromEntries(Object.keys(defaultLocation).map((field) => [field, searchParams.get(field) || ''])))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({ availability: searchParams.get('availability') || 'AVAILABLE' })
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [donors, setDonors] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    getBloodDonors({
      search,
      bloodGroup: selectedGroup,
      ...location,
      availability: filters.availability,
      page: pagination.page,
      limit: PAGE_SIZE,
    }).then((result) => {
      if (!current) return
      setDonors(result.donors || [])
      setPagination(result.pagination)
    }).catch((requestError) => {
      if (current) setError(requestError.message)
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [filters.availability, location, pagination.page, reloadKey, search, selectedGroup])

  useEffect(() => {
    const params = new URLSearchParams({ category: 'blood', bloodGroup: selectedGroup })
    if (search) params.set('search', search)
    Object.entries(location).forEach(([key, value]) => { if (value) params.set(key, value) })
    if (filters.availability) params.set('availability', filters.availability)
    setSearchParams(params, { replace: true })
  }, [filters.availability, location, search, selectedGroup, setSearchParams])

  const handleLocationChange = (field, value) => {
    setLocation((current) => ({ ...current, [field]: value }))
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const handleAvailabilityChange = (availability) => {
    setFilters({ availability })
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ availability: '' })
    setLocation(defaultLocation)
    setSearch('')
    setPagination((current) => ({ ...current, page: 1 }))
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Community support"
        title="রক্ত খুঁজুন / Blood Donor Finder"
        subtitle="Search for compatible donors nearby, scan verification status, and review safety guidance before contacting anyone."
      />

      <BloodHero />

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Selected group</p>
          <p className="mt-2 text-2xl font-bold text-white">{selectedGroup}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Location</p>
          <p className="mt-2 text-2xl font-bold text-white">{location.division || 'Any'}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{filters.availability === 'UNAVAILABLE' ? 'Unavailable' : filters.availability === 'AVAILABLE' ? 'Available' : 'Verified donors'}</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{pagination.total}</p>
        </GlassCard>
      </div>

      <BloodGroupSelector selectedGroup={selectedGroup} onSelect={(group) => { setSelectedGroup(group); setPagination((current) => ({ ...current, page: 1 })) }} />
      <BloodSearch
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })) }}
        location={location}
        onLocationChange={handleLocationChange}
        onSearch={() => { setSelectedDonor(null); setPagination((current) => ({ ...current, page: 1 })) }}
      />
      <BloodFilters availability={filters.availability} onAvailabilityChange={handleAvailabilityChange} onClear={clearFilters} />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Results</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{pagination.total} donors found</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-slate-950/20 px-3 py-1.5 text-sm text-slate-200">
              Verified donors
            </div>
          </div>

          {loading ? <LoadingState label="Loading verified donors" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} /> : donors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {donors.map((donor) => (
                <BloodDonorCard key={donor.id} donor={donor} onView={setSelectedDonor} />
              ))}
            </div>
          ) : (
            <GlassCard className="p-6 text-center text-slate-200">
              <p className="text-lg font-semibold text-white">No donors match the selected filters.</p>
              <p className="mt-2 text-sm">Try switching the blood group or clearing the availability filter.</p>
            </GlassCard>
          )}
          {!loading && !error && pagination.pages > 1 && <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Next</button></div></div>}
        </div>

        <div className="space-y-4">
          <BloodSafetyNotice />
          <BloodMatchingInfo />
        </div>
      </div>

      <DonorDetails donor={selectedDonor} onClose={() => setSelectedDonor(null)} />
    </div>
  )
}

export default Blood

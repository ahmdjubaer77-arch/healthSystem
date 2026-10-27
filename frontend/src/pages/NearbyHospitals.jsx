import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import {
  Building2,
  CheckCircle2,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import { API_BASE_URL } from '../services/api'

const distanceOptions = [1, 5, 10, 20]
const sortOptions = ['nearest', 'farthest']

const hospitalIcon = divIcon({
  className: 'hospital-marker',
  html: '<div class="h-8 w-8 rounded-full border-4 border-white bg-red-500 shadow-lg"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const userIcon = divIcon({
  className: 'user-marker',
  html: '<div class="h-7 w-7 rounded-full border-4 border-white bg-cyan-400 shadow-lg"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function FitMap({ hospitals, userLocation }) {
  const map = useMap()

  useEffect(() => {
    const points = []
    if (userLocation) points.push([userLocation.latitude, userLocation.longitude])
    hospitals.forEach((hospital) => points.push([hospital.coordinates.latitude, hospital.coordinates.longitude]))

    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 12 })
    } else if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 11)
    }
  }, [hospitals, map, userLocation])

  return null
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`
  return `${distanceKm.toFixed(1)} km away`
}

function NearbyHospitals() {
  const [userLocation, setUserLocation] = useState(null)
  const [hospitals, setHospitals] = useState([])
  const [distance, setDistance] = useState(5)
  const [sort, setSort] = useState('nearest')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [type, setType] = useState('')
  const [locationState, setLocationState] = useState('idle')
  const [locationMessage, setLocationMessage] = useState('')
  const [error, setError] = useState('')

  const loadHospitals = useCallback(async (location, requestedDistance, query, signal) => {
    setLocationState('loading')
    setError('')

    try {
      const params = new URLSearchParams({
        lat: String(location.latitude),
        lng: String(location.longitude),
        radius: String(requestedDistance),
      })
      if (query?.trim()) params.set('q', query.trim())

      const response = await fetch(`${API_BASE_URL}/hospitals/nearby?${params.toString()}`, { signal })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error('Unable to load nearby healthcare facilities.')
      setHospitals(result.data.hospitals)
      setLocationState('ready')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setLocationState('error')
        setError('Nearby healthcare facilities are temporarily unavailable. Please try again.')
      }
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Location access is needed to find nearby healthcare facilities.')
      return
    }

    setLocationState('locating')
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { latitude: position.coords.latitude, longitude: position.coords.longitude }
        setUserLocation(location)
      },
      (failure) => {
        setLocationState('error')
        setLocationMessage('Location access is needed to find nearby healthcare facilities.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }, [])

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => window.clearTimeout(debounceTimer)
  }, [searchTerm])

  useEffect(() => {
    if (!userLocation) return undefined

    const controller = new AbortController()
    loadHospitals(userLocation, distance, debouncedSearchTerm, controller.signal)
    return () => controller.abort()
  }, [debouncedSearchTerm, distance, loadHospitals, userLocation])

  const visibleHospitals = useMemo(() => {
    const filtered = type ? hospitals.filter((hospital) => hospital.type === type) : hospitals
    return sort === 'farthest' ? [...filtered].reverse() : filtered
  }, [hospitals, sort, type])

  const handleDistanceChange = (nextDistance) => {
    setDistance(nextDistance)
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Nearby healthcare"
        title="Find nearby hospitals and care centers"
        subtitle="Find hospitals and medical facilities near you"
      />

      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={requestLocation}
            disabled={locationState === 'locating' || locationState === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Crosshair size={16} /> Use My Location
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-4 py-2 text-xs text-slate-300">
            <Clock3 size={14} /> Location is used only for this search
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-200">
            <Search size={17} className="text-cyan-200" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search medical/hospital..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-200">
            <SlidersHorizontal size={16} className="text-cyan-200" />
            <select value={type} onChange={(event) => setType(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              <option value="" className="bg-slate-900">All types</option>
              <option value="Government" className="bg-slate-900">Government</option>
              <option value="Private" className="bg-slate-900">Private</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-200">
            <MapPin size={16} className="text-cyan-200" />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
              {sortOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900">{option === 'nearest' ? 'Nearest' : 'Farthest'}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Distance</span>
          {distanceOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleDistanceChange(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${distance === option ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              Within {option} km
            </button>
          ))}
        </div>
      </GlassCard>

      {locationMessage && (
        <GlassCard className="p-5 text-sm leading-6 text-amber-100">
          {locationMessage}
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 text-sm text-rose-100">
          {error}
          <button type="button" onClick={() => userLocation && loadHospitals(userLocation, distance, debouncedSearchTerm)} className="mt-3 rounded-full border border-rose-300/30 px-4 py-2 text-xs font-semibold text-rose-100">Try again</button>
        </GlassCard>
      )}

      {locationState === 'locating' && (
        <GlassCard className="p-8 text-center text-slate-200">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
          <p className="mt-4 font-medium">Finding your location...</p>
        </GlassCard>
      )}

      {locationState === 'loading' && (
        <GlassCard className="p-8 text-center text-slate-200">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
          <p className="mt-4 font-medium">Finding nearby healthcare facilities...</p>
        </GlassCard>
      )}

      {locationState === 'ready' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <GlassCard className="overflow-hidden p-2">
            <div className="relative h-[430px] min-h-[430px] overflow-hidden rounded-[24px] bg-slate-900 sm:h-[520px]">
              <MapContainer center={[userLocation?.latitude || 23.685, userLocation?.longitude || 90.36]} zoom={11} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userLocation && <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon} />}
                {visibleHospitals.map((hospital) => (
                  <Marker key={hospital.id} position={[hospital.coordinates.latitude, hospital.coordinates.longitude]} icon={hospitalIcon}>
                    <Popup>
                      <div className="min-w-56 rounded-2xl bg-slate-950 p-4 text-slate-100">
                        <h3 className="font-semibold text-white">{hospital.name}</h3>
                        <p className="mt-1 text-xs text-slate-300">{formatDistance(hospital.distanceKm)}</p>
                        <p className="mt-3 text-xs text-slate-300">{hospital.address}</p>
                        <p className="mt-2 text-xs text-emerald-300">{hospital.emergencyAvailable ? 'Emergency available' : 'Emergency status not listed'}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <FitMap hospitals={visibleHospitals} userLocation={userLocation} />
              </MapContainer>
            </div>
          </GlassCard>

          <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-slate-300">{visibleHospitals.length} facility{visibleHospitals.length === 1 ? '' : 'ies'}</p>
              <p className="text-xs text-slate-400">Sorted by distance</p>
            </div>
            {visibleHospitals.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <Building2 className="mx-auto text-slate-400" size={28} />
                <h3 className="mt-3 font-semibold text-white">No healthcare facilities found.</h3>
                <button type="button" onClick={() => setDistance(Math.min(20, distance + 5))} className="mt-4 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">Increase Distance</button>
              </GlassCard>
            ) : visibleHospitals.map((hospital) => (
              <GlassCard key={hospital.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{hospital.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-200">
                      {hospital.verificationStatus === 'VERIFIED' ? <ShieldCheck size={13} /> : <Building2 size={13} />}
                      {hospital.verificationStatus === 'VERIFIED' ? 'Verified' : 'Verification pending'}
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-200">{hospital.type}</span>
                </div>
                <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-slate-300"><MapPin size={14} className="mt-0.5 shrink-0 text-cyan-200" />{hospital.address}</p>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm">
                  <span className="text-slate-300">Distance</span>
                  <span className="font-semibold text-cyan-100">{formatDistance(hospital.distanceKm)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200">Emergency <span className="mt-1 block font-semibold text-emerald-300">{hospital.emergencyAvailable ? 'Available' : 'Not listed'}</span></div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200">Status <span className="mt-1 block font-semibold text-slate-100">{hospital.operatingStatus}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${hospital.phone}`} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100"><Phone size={13} /> Call</a>
                  <a href={`https://www.openstreetmap.org/?mlat=${hospital.coordinates.latitude}&mlon=${hospital.coordinates.longitude}#map=14/${hospital.coordinates.latitude}/${hospital.coordinates.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100"><Navigation size={13} /> Directions</a>
                  <a href={`/hospitals/nearby/${hospital.id}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`} className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100"><CheckCircle2 size={13} /> View Details</a>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NearbyHospitals

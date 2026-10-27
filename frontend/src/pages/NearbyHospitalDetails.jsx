import { ArrowLeft, Building2, Clock3, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GlassCard from '../components/common/GlassCard'
import NearbyHospitalMap from '../components/hospitals/NearbyHospitalMap'
import { API_BASE_URL } from '../services/api'

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`
  return `${distanceKm.toFixed(1)} km away`
}

function NearbyHospitalDetails() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadHospital = async () => {
      try {
        const params = new URLSearchParams(searchParams)
        const response = await fetch(`${API_BASE_URL}/hospitals/${id}?${params.toString()}`)
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error('Unable to load hospital details.')
        if (active) {
          setHospital(result.data.hospital)
          setLoading(false)
        }
      } catch {
        if (active) {
          setError('Hospital details are temporarily unavailable.')
          setLoading(false)
        }
      }
    }
    loadHospital()
    return () => { active = false }
  }, [id])

  if (loading) return <GlassCard className="p-8 text-center text-slate-300">Loading hospital details...</GlassCard>
  if (error || !hospital) return <GlassCard className="p-8 text-center text-rose-100">{error}</GlassCard>

  return (
    <div className="space-y-6 py-4">
      <Link to="/hospitals/nearby" className="inline-flex items-center gap-2 text-sm text-cyan-100"><ArrowLeft size={15} /> Back to nearby hospitals</Link>
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Nearby facility</p>
            <h1 className="mt-2 text-3xl font-bold text-white">{hospital.name}</h1>
            <p className="mt-2 text-sm text-slate-300">{hospital.type} facility</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100">
            <ShieldCheck size={14} /> {hospital.verificationStatus === 'VERIFIED' ? 'Verified' : 'Verification pending'}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <GlassCard className="overflow-hidden p-2">
          <div className="h-[360px] overflow-hidden rounded-[24px]">
            <NearbyHospitalMap hospitals={[hospital]} userLocation={null} />
          </div>
        </GlassCard>
        <div className="space-y-4">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3"><MapPin size={18} className="text-cyan-200" /><h2 className="text-xl font-bold text-white">Facility information</h2></div>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-cyan-200" />{hospital.address}</p>
              <p className="flex items-center gap-2"><Phone size={15} className="text-cyan-200" />{hospital.phone || 'Phone not listed'}</p>
              <p className="flex items-center gap-2"><Clock3 size={15} className="text-cyan-200" />{hospital.operatingStatus}</p>
              <p className="flex items-center gap-2"><Building2 size={15} className="text-cyan-200" />{formatDistance(hospital.distanceKm)}</p>
            </div>
            <div className="mt-5 grid gap-2">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 p-3"><span className="text-slate-300">Emergency</span><span className="font-semibold text-emerald-300">{hospital.emergencyAvailable ? 'Available' : 'Not listed'}</span></div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 p-3"><span className="text-slate-300">Services</span><span className="text-right text-sm text-slate-200">{hospital.services.length ? hospital.services.join(', ') : 'Not listed'}</span></div>
            </div>
          </GlassCard>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${hospital.phone}`} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm text-cyan-100"><Phone size={15} /> Call</a>
            <a href={`https://www.openstreetmap.org/?mlat=${hospital.coordinates.latitude}&mlon=${hospital.coordinates.longitude}#map=14/${hospital.coordinates.latitude}/${hospital.coordinates.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100"><Navigation size={15} /> Directions</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NearbyHospitalDetails

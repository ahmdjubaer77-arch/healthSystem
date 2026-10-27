import { Clock3, MapPin, Phone, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function AmbulanceDetails({ ambulance }) {
  if (!ambulance) return null

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">Ambulance details</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{ambulance.provider}</h2>
        </div>
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-2 text-red-100">
          <ShieldCheck size={18} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Type</div>
          <div className="mt-2 text-sm font-medium text-white">{ambulance.type}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Availability</div>
          <div className="mt-2 text-sm font-medium text-white">{ambulance.availability}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Verification</div>
          <div className="mt-2 text-sm font-medium text-white">{ambulance.verificationStatus}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Distance</div>
          <div className="mt-2 text-sm font-medium text-white">{ambulance.distance}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {ambulance.upazila}, {ambulance.area}</div>
        <div className="flex items-center gap-2"><Phone size={14} className="text-cyan-200" /> {ambulance.phone}</div>
        <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-200" /> {ambulance.operatingHours}</div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
        <div className="font-medium text-white">Association</div>
        <div className="mt-2">{ambulance.hospitalAssociation}</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`tel:${ambulance.phone}`} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100">
          📞 Call
        </a>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100">
          📍 Directions
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100">
          🏥 Hospital
        </button>
      </div>
    </GlassCard>
  )
}

export default AmbulanceDetails

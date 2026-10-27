import { ArrowRight, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

const statusLabels = { AVAILABLE: 'Available', BUSY: 'Busy', OFFLINE: 'Offline' }
const statusStyles = {
  AVAILABLE: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  BUSY: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  OFFLINE: 'border-slate-300/20 bg-slate-400/10 text-slate-200',
}

function AmbulanceCard({ ambulance, onView }) {
  const vehicleTypes = [...new Set((ambulance.vehicles || []).map((vehicle) => vehicle.vehicleType).filter(Boolean))]
  const location = [ambulance.upazila, ambulance.district, ambulance.division].filter(Boolean).join(', ')

  return (
    <GlassCard className="h-full border-white/[0.08] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{ambulance.name}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-200"><ShieldCheck size={13} />Verified provider</div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyles[ambulance.operationalStatus] || statusStyles.OFFLINE}`}>
          {statusLabels[ambulance.operationalStatus] || ambulance.operationalStatus}
        </span>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
        <div className="flex items-center gap-2 font-medium text-white"><Truck size={15} className="text-cyan-200" />{vehicleTypes.join(', ') || 'Vehicle type not listed'}</div>
        <div className="mt-2">Service area: {ambulance.serviceAreas?.join(', ') || 'Not provided'}</div>
      </div>
      <div className="mt-4 space-y-2.5 text-sm text-slate-200">
        <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-cyan-200" />{location || 'Location not provided'}</div>
        <div className="text-xs text-slate-400">Status is provider-reported. Call to confirm; this page does not dispatch or assign vehicles.</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onView(ambulance)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"><span>Details</span><ArrowRight size={14} /></button>
        {ambulance.contactPhone && <a href={`tel:${ambulance.contactPhone}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-100"><Phone size={14} />Call</a>}
      </div>
    </GlassCard>
  )
}

export default AmbulanceCard

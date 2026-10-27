import { ArrowRight, MapPin, PhoneCall, ShieldCheck, TimerReset } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function HospitalCard({ hospital }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{hospital.name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <MapPin size={14} className="text-cyan-200" />
            {hospital.location}
          </p>
        </div>
        <StatusBadge label={hospital.status} variant={hospital.status === 'Open' ? 'success' : 'warning'} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-200">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{hospital.distance}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{hospital.emergency}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-xs text-slate-300">
        <div className="flex items-center justify-between gap-2">
          <span>Last updated</span>
          <span>{hospital.lastUpdated}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          {hospital.verified ? (
            <>
              <ShieldCheck size={14} className="text-emerald-300" />
              Verified
            </>
          ) : (
            <>
              <TimerReset size={14} className="text-amber-300" />
              Demo listing
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-[10px] font-medium text-slate-100 transition hover:bg-white/10">
            <PhoneCall size={12} />
            Call
          </button>
          <button className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-2 text-[10px] font-medium text-cyan-100 transition hover:bg-cyan-400/20">
            <ArrowRight size={12} />
            View
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

export default HospitalCard

import { Building2, CalendarClock, FileClock } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function HospitalVisitCard({ visit }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{visit.hospital}</h3>
            <p className="text-sm text-slate-300">{visit.department}</p>
          </div>
        </div>
        <StatusBadge label={visit.status} variant={visit.statusVariant} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Admission</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
            <CalendarClock size={14} className="text-cyan-200" />
            {visit.admissionDate}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Discharge</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
            <FileClock size={14} className="text-cyan-200" />
            {visit.dischargeDate}
          </p>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-200">Visit type: {visit.visitType}</div>
    </GlassCard>
  )
}

export default HospitalVisitCard

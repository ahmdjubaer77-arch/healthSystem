import { CalendarClock, MapPin, Stethoscope } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function DoctorVisitCard({ visit }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <Stethoscope size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{visit.doctor}</h3>
            <p className="text-sm text-slate-300">{visit.specialty}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200">
          {visit.visitType}
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-cyan-200" />
          <span>{visit.clinic}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock size={14} className="text-cyan-200" />
          <span>{visit.date}</span>
        </div>
        {visit.followUpDate && (
          <div className="flex items-center gap-2">
            <CalendarClock size={14} className="text-cyan-200" />
            <span>Follow-up: {visit.followUpDate}</span>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
        Notes indicator: {visit.notes}
      </div>
    </GlassCard>
  )
}

export default DoctorVisitCard

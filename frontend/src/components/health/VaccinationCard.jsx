import { CalendarCheck2, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function VaccinationCard({ vaccination }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{vaccination.name}</h3>
            <p className="text-sm text-slate-300">{vaccination.provider}</p>
          </div>
        </div>
        <StatusBadge label={vaccination.status} variant={vaccination.statusVariant} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Date</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
            <CalendarCheck2 size={14} className="text-cyan-200" />
            {vaccination.date}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Dose</p>
          <p className="mt-2 text-sm font-medium text-white">{vaccination.dose}</p>
        </div>
      </div>
    </GlassCard>
  )
}

export default VaccinationCard

import { CalendarRange, Pill, UserRound } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function MedicationCard({ medication }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <Pill size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{medication.name}</h3>
            <p className="text-sm text-slate-300">{medication.genericName}</p>
          </div>
        </div>
        <StatusBadge label={medication.status} variant={medication.statusVariant} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Dosage</p>
          <p className="mt-2 text-sm font-medium text-white">{medication.dosage}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Frequency</p>
          <p className="mt-2 text-sm font-medium text-white">{medication.frequency}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-cyan-200" />
          <span>Prescribed by: {medication.prescribedBy}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarRange size={14} className="text-cyan-200" />
          <span>Start date: {medication.startDate}</span>
        </div>
        {medication.endDate && (
          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="text-cyan-200" />
            <span>End date: {medication.endDate}</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

export default MedicationCard

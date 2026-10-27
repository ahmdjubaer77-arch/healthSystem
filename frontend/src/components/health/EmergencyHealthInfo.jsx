import { AlertTriangle, ShieldAlert } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function EmergencyHealthInfo({ emergencyInfo }) {
  const allergies = emergencyInfo.allergies || []
  const existingConditions = emergencyInfo.existingConditions || []
  const currentMedications = emergencyInfo.currentMedications || []

  return (
    <section id="emergency-info" className="scroll-mt-24">
      <GlassCard className="overflow-hidden border-amber-300/20 bg-[linear-gradient(135deg,rgba(120,119,198,0.12),rgba(15,23,42,0.8),rgba(120,53,15,0.14))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Emergency health information</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Emergency health information</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
            <ShieldAlert size={14} />
            {emergencyInfo.source}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
              <AlertTriangle size={14} className="text-amber-200" />
              Blood group
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{emergencyInfo.bloodGroup}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Emergency contact</div>
            <p className="mt-2 text-lg font-semibold text-white">{emergencyInfo.emergencyContact}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Allergies</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {allergies.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Existing conditions</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {existingConditions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Current important medications</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {currentMedications.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <StatusBadge label="User-provided information" variant="warning" />
        </div>
      </GlassCard>
    </section>
  )
}

export default EmergencyHealthInfo

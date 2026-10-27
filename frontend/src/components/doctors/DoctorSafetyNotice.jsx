import { AlertTriangle, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function DoctorSafetyNotice() {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-2 text-emerald-100">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Healthcare trust</p>
          <h3 className="mt-2 text-xl font-bold text-white">Always confirm a doctor's profile and verification details are up to date.</h3>
          <p className="mt-2 text-sm text-slate-200">Always verify provider information before relying on it for healthcare decisions. This platform does not replace professional medical advice.</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
        <AlertTriangle size={16} />
        If you are experiencing a medical emergency, use the Emergency section or contact appropriate emergency services.
      </div>
    </GlassCard>
  )
}

export default DoctorSafetyNotice

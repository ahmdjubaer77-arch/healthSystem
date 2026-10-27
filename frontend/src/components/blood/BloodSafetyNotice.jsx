import { AlertTriangle, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function BloodSafetyNotice() {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-2 text-emerald-100">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Safety notice</p>
          <h3 className="mt-2 text-xl font-bold text-white">The platform connects users with potential donors.</h3>
          <p className="mt-2 text-sm text-slate-200">It does not determine medical eligibility for blood donation or transfusion.</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
        <AlertTriangle size={16} />
        This module supports discovery and communication only; it does not replace professional medical assessment.
      </div>
    </GlassCard>
  )
}

export default BloodSafetyNotice

import { AlertTriangle } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function EmergencyNotice() {
  return (
    <GlassCard className="border-amber-300/20 bg-amber-500/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/15 p-2 text-amber-100">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Emergency safety</p>
          <p className="mt-2 text-sm text-amber-50">
            If the situation is life-threatening, contact official emergency services immediately.
          </p>
        </div>
      </div>
    </GlassCard>
  )
}

export default EmergencyNotice

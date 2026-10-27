import { AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function RequestVerification({ status = 'Pending Verification' }) {
  const statusMap = {
    'Pending Verification': { icon: Clock3, tone: 'border-amber-300/20 bg-amber-500/10 text-amber-100' },
    Verified: { icon: CheckCircle2, tone: 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' },
    Rejected: { icon: XCircle, tone: 'border-red-300/20 bg-red-500/10 text-red-100' },
  }

  const config = statusMap[status] || statusMap['Pending Verification']
  const Icon = config.icon

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl border p-2 ${config.tone}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Request verification</p>
          <h3 className="mt-2 text-xl font-bold text-white">Status: {status}</h3>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
        <AlertTriangle size={16} />
        Verification is a demo status for this frontend prototype and does not confirm real donor eligibility.
      </div>
    </GlassCard>
  )
}

export default RequestVerification

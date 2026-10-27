import { Clock3, Droplets, MapPin, ShieldAlert, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

const statusStyles = {
  Pending: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  Active: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-200',
  Matched: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  Fulfilled: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  Expired: 'border-red-400/30 bg-red-500/15 text-red-200',
  Cancelled: 'border-slate-400/30 bg-slate-500/10 text-slate-200',
}

function BloodRequestCard({ request }) {
  return (
    <GlassCard className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">Blood group</div>
          <div className="mt-2 text-2xl font-bold text-white">{request.bloodGroup}</div>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyles[request.requestStatus] || statusStyles.Pending}`}>
          {request.requestStatus}
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2"><Droplets size={14} className="text-red-200" /> {request.unitsRequired} units required</div>
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {request.hospital}</div>
        <div className="flex items-center gap-2"><UserRound size={14} className="text-cyan-200" /> {request.contactPerson}</div>
        <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-200" /> {request.requiredDateTime}</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Urgency</div>
          <div className="mt-2 text-sm font-medium text-white">{request.urgency}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Verification</div>
          <div className="mt-2 text-sm font-medium text-white">{request.verificationStatus}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 text-xs text-slate-300">
        <span>Created: {request.createdAt}</span>
        <span>Expires: {request.expiresIn}</span>
      </div>

      <Link to={`/blood/requests/${request.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
        <ShieldAlert size={14} />
        View Details
      </Link>
    </GlassCard>
  )
}

export default BloodRequestCard

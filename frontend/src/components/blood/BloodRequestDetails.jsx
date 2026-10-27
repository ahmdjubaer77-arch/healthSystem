import { Clock3, Droplets, MapPin, ShieldAlert, UserRound } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function BloodRequestDetails({ request, onReport }) {
  if (!request) return null

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Request details</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{request.bloodGroup} Blood Request</h2>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100">{request.requestStatus}</div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Units required</div>
            <div className="mt-2 text-white">{request.unitsRequired}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Hospital</div>
            <div className="mt-2 text-white">{request.hospital}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Urgency</div>
            <div className="mt-2 text-white">{request.urgency}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Division</div>
            <div className="mt-2 text-white">{request.division}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">District</div>
            <div className="mt-2 text-white">{request.district}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Upazila</div>
            <div className="mt-2 text-white">{request.upazila}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-2"><Droplets size={14} className="text-red-200" /> Required date/time: {request.requiredDateTime}</div>
            <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-200" /> Expires in: {request.expiresIn}</div>
            <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> Location: {request.upazila}</div>
            <div className="flex items-center gap-2"><UserRound size={14} className="text-cyan-200" /> Contact person: {request.contactPerson}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4 text-sm text-slate-200">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Verification status</div>
            <div className="mt-2 text-white">{request.verificationStatus}</div>
            <div className="mt-5 text-[10px] uppercase tracking-[0.14em] text-slate-400">Notes</div>
            <p className="mt-2 text-white">{request.notes}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onReport} className="inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70">
            <ShieldAlert size={14} />
            Report request
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

export default BloodRequestDetails

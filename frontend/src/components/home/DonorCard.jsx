import { MapPin, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function DonorCard({ donor }) {
  const badgeVariant = donor.availability === 'green' ? 'success' : donor.availability === 'amber' ? 'warning' : 'danger'

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{donor.name}</h3>
          <p className="mt-1 text-sm text-cyan-100">Blood Group: {donor.group}</p>
        </div>
        <StatusBadge label={donor.status} variant={badgeVariant} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <MapPin size={14} className="text-cyan-200" />
          Approx. {donor.location}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
        <span>Last update: {donor.lastUpdated}</span>
        <span className="flex items-center gap-1 text-emerald-300">
          <ShieldCheck size={12} />
          Demo listing
        </span>
      </div>
    </GlassCard>
  )
}

export default DonorCard

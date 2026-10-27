import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function BloodDonorCard({ donor, onView }) {
  const statusStyles = {
    AVAILABLE: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
    UNAVAILABLE: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  }

  return (
    <GlassCard className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">Donor</div>
          <div className="mt-2 text-xl font-bold text-white">{donor.name}</div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusStyles[donor.availability] || 'border-slate-300/20 bg-slate-400/10 text-slate-200'}`}>
          {donor.availability === 'AVAILABLE' ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-semibold text-white">{donor.bloodGroup}</h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-200">
          <CheckCircle2 size={14} />
          {donor.verificationStatus}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {[donor.location?.upazila, donor.location?.district, donor.location?.division].filter(Boolean).join(', ') || 'Location not provided'}</div>
      </div>

      <button
        type="button"
        onClick={() => onView(donor)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        View
        <ArrowRight size={14} />
      </button>
    </GlassCard>
  )
}

export default BloodDonorCard

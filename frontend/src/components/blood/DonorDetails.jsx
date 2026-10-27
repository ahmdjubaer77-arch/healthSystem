import { CheckCircle2, MapPin, Phone } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function DonorDetails({ donor, onClose }) {
  if (!donor) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-xl p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">{donor.verificationStatus}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{donor.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-slate-950/20 px-2.5 py-1.5 text-sm text-slate-200">Close</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Blood group</div>
            <div className="mt-2 text-lg font-semibold text-white">{donor.bloodGroup}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Verification</div>
            <div className="mt-2 text-lg font-semibold text-white">{donor.verificationStatus}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Availability</div>
            <div className="mt-2 text-lg font-semibold text-white">{donor.availability}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">District</div>
              <div className="mt-2 text-sm text-white">{donor.location?.district || 'Not provided'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Upazila</div>
            <div className="mt-2 text-sm text-white">{donor.location?.upazila || 'Not provided'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Division</div>
            <div className="mt-2 text-sm text-white">{donor.location?.division || 'Not provided'}</div>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-200">
          <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {[donor.location?.upazila, donor.location?.district, donor.location?.division].filter(Boolean).join(', ')}</div>
          {donor.verificationStatus === 'VERIFIED' && <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-200" /> Donor verification confirmed</div>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {donor.phoneConsent === true && donor.phone && <a href={`tel:${donor.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100"><Phone size={16} />Call donor</a>}
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
            Close
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

export default DonorDetails

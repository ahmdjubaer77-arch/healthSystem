import { CreditCard, Stethoscope } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function ConsultationInfo({ doctor }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Consultation information</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
          <div className="flex items-center gap-2 text-cyan-100"><Stethoscope size={15} /> Current availability</div>
          <div className="mt-3 text-white">{doctor.availability}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
          <div className="flex items-center gap-2 text-cyan-100"><CreditCard size={15} /> Consultation fee</div>
          <div className="mt-3 text-white">{doctor.consultationFee == null ? 'Not provided' : `${doctor.consultationFee} BDT`}</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">Availability and fee are profile information; contact the clinic to confirm before visiting.</p>
    </GlassCard>
  )
}

export default ConsultationInfo

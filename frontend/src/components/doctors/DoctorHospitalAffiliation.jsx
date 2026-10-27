import { Building2, MapPin, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function DoctorHospitalAffiliation({ doctor }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Hospital affiliation</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{doctor.hospitalName || 'Hospital / clinic not provided'}</h3>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-100">Doctor</div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Location</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white"><MapPin size={14} className="text-cyan-200" /> {[doctor.upazila, doctor.district, doctor.division].filter(Boolean).join(', ')}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Verification</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white"><ShieldCheck size={14} className="text-emerald-200" /> {doctor.verificationStatus}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Provider type</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white"><Building2 size={14} className="text-cyan-200" /> {doctor.providerType}</div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">Contact the clinic directly to confirm address and services.</p>
    </GlassCard>
  )
}

export default DoctorHospitalAffiliation

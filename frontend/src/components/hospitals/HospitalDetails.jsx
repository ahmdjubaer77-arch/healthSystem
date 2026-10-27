import { Building2, MapPin, Phone, ShieldAlert } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function HospitalDetails({ hospital }) {
  if (!hospital) return null

  const verificationLabel = hospital.verificationStatus === 'VERIFIED' ? 'Verified Hospital' : hospital.verificationStatus

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Hospital overview</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{hospital.name}</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-100">
              <ShieldAlert size={14} />
              {verificationLabel}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-right"><div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Provider type</div><div className="mt-2 text-lg font-semibold text-white">Hospital</div></div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['Address', hospital.address, MapPin],
            ['Division', hospital.division, MapPin],
            ['District', hospital.district, MapPin],
            ['Upazila', hospital.upazila, MapPin],
            ['Public phone', hospital.phone, Phone],
          ].filter(([, value]) => value).map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200"><div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</div><div className="mt-2 flex items-start gap-2 text-white"><Icon size={14} className="mt-0.5 shrink-0 text-cyan-200" />{value}</div></div>)}
        </div>
        {hospital.phone && <a href={`tel:${hospital.phone}`} className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100"><Phone size={14} />Call hospital</a>}
      </GlassCard>
      <p className="text-xs leading-5 text-slate-500">Services, operating hours, and emergency availability are not listed unless confirmed by the hospital.</p>
    </div>
  )
}

export default HospitalDetails

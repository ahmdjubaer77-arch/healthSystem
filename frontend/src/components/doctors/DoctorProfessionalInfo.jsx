import GlassCard from '../common/GlassCard'

function DoctorProfessionalInfo({ doctor }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Professional information</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Qualification</div>
          <div className="mt-3 text-sm text-white">{doctor.qualification || 'Not provided'}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Specialty</div>
          <div className="mt-3 text-sm text-white">{doctor.specialty || 'Not provided'}</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4 md:col-span-2">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">BMDC registration number</div>
          <div className="mt-3 text-sm text-white">{doctor.registrationNumber || 'Not provided'}</div>
        </div>
      </div>
    </GlassCard>
  )
}

export default DoctorProfessionalInfo

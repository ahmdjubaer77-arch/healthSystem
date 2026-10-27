import { ArrowLeft, HeartPulse, MapPin, Phone, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import VerificationBadge from './VerificationBadge'

function DoctorProfileHeader({ doctor }) {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-300/30 bg-cyan-500/10 text-cyan-100">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{doctor.name}</h2>
              <VerificationBadge status={doctor.verificationStatus} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-cyan-100/80">
              <Stethoscope size={14} />
              {doctor.specialty}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
              <MapPin size={14} className="text-cyan-200" />
              {[doctor.upazila, doctor.district, doctor.division].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>

        {doctor.contactPhone && <a href={`tel:${doctor.contactPhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100"><Phone size={16} />Call clinic</a>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Experience</div>
          <div className="mt-2 text-lg font-semibold text-white">{doctor.experienceYears ?? 'Not provided'} years</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Hospital</div>
          <div className="mt-2 text-sm text-white">{doctor.hospitalName || 'Not provided'}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Consultation</div>
          <div className="mt-2 text-sm text-white">{doctor.availability}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/doctors" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-slate-200">
          <ArrowLeft size={14} />
          Back to doctors
        </Link>
        <Link to="/emergency" className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <HeartPulse size={14} />
          Need Emergency Care?
        </Link>
      </div>
    </GlassCard>
  )
}

export default DoctorProfileHeader

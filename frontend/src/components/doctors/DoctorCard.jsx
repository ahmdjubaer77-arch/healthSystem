import { ArrowRight, Clock3, MapPin, Phone, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import VerificationBadge from './VerificationBadge'

function DoctorCard({ doctor }) {
  return (
    <GlassCard className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-500/10 text-cyan-100">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{doctor.name}</h3>
            <p className="mt-1 text-sm text-cyan-100/80">{doctor.specialty}</p>
          </div>
        </div>
        <VerificationBadge status={doctor.verificationStatus} />
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-200">
        <div className="text-slate-300">{doctor.qualification || 'Qualification not provided'}</div>
        <div className="flex items-center gap-2"><Clock3 size={14} className="text-cyan-200" /> {doctor.experienceYears ?? 'Not provided'} years experience</div>
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {doctor.hospitalName || 'Hospital / clinic not provided'}</div>
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {[doctor.upazila, doctor.district, doctor.division].filter(Boolean).join(', ')}</div>
        <div className="flex items-center gap-2"><Phone size={14} className="text-cyan-200" /> {doctor.availability}</div>
        <div>Consultation fee: {doctor.consultationFee == null ? 'Not provided' : `${doctor.consultationFee} BDT`}</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link to={`/doctors/${doctor.id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          View profile
          <ArrowRight size={14} />
        </Link>
        {doctor.contactPhone && <a href={`tel:${doctor.contactPhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100"><Phone size={15} />Call</a>}
      </div>
    </GlassCard>
  )
}

export default DoctorCard

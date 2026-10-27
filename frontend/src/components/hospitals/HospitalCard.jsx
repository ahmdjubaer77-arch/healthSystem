import { ArrowRight, Building2, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import { useLanguage } from '../../context/LanguageContext'

function HospitalCard({ hospital }) {
  const { t } = useLanguage()
  const location = [hospital.upazila, hospital.district, hospital.division].filter(Boolean).join(', ')

  return (
    <GlassCard className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{hospital.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-emerald-200"><ShieldCheck size={14} /> {t('homeVerifiedHospital', 'Verified Hospital')}</div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200"><Building2 size={17} /></span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-cyan-200" /><span>{location || hospital.address || t('homeLocationNotListed', 'Location not listed')}</span></div>
        {hospital.address && location && <p className="pl-5 text-xs text-slate-400">{hospital.address}</p>}
      </div>

      {hospital.phone && <a href={`tel:${hospital.phone}`} aria-label={`${t('homeCall', 'Call')} ${hospital.name}: ${hospital.phone}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-100"><Phone size={14} />{hospital.phone}</a>}

      <Link
        to={`/hospitals/${hospital.id}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        {t('homeViewDetails', 'View Details')}
        <ArrowRight size={14} />
      </Link>
    </GlassCard>
  )
}

export default HospitalCard

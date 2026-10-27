import { Ambulance, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import GlassCard from '../common/GlassCard'

function EmergencyRequest() {
  const { t } = useLanguage()

  return (
    <GlassCard as="section" aria-labelledby="emergency-request-title" className="p-4 sm:p-5 lg:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">
          {t('emergencyRequestKicker', 'Emergency support')}
        </p>
        <h2 id="emergency-request-title" className="mt-2 text-2xl font-bold text-white">
          {t('emergencyRequestUnavailable', 'Emergency requests are not connected')}
        </h2>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-200">
        {t('emergencyRequestNotice', 'This website does not send dispatch requests. Do not enter medical or personal details here. Use official emergency services for immediate help.')}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          to="/hospitals"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <Building2 size={16} aria-hidden="true" />
          {t('homeFindHospitals', 'Browse hospitals')}
        </Link>
        <Link
          to="/ambulances"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <Ambulance size={16} aria-hidden="true" />
          {t('homeAmbulanceListings', 'Browse ambulance listings')}
        </Link>
      </div>
    </GlassCard>
  )
}

export default EmergencyRequest

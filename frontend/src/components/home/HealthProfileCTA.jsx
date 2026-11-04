import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import { useLanguage } from '../../context/LanguageContext'

function HealthProfileCTA() {
  const { t } = useLanguage()

  return (
    <section className="home-health-promo">
      <GlassCard className="home-health-cta overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="home-health-kicker">{t('homeHealthKicker', 'Personal health')}</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t('homeHealthTitle', 'Keep your health information organized')}</h2>
            <p className="home-health-description">
              {t('homeHealthDescription', 'Keep your medical history, prescriptions, reports, doctor visits, and emergency contacts together.')}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4">
            <Link
              to="/health"
              className="home-health-link"
            >
              {t('myHealth', 'Open My Health')}
              <ArrowRight size={16} />
            </Link>
            <div className="home-health-private">
              <ShieldCheck size={16} className="text-emerald-300" />
              {t('homePrivateInfo', 'Designed to help keep your health information private and secure.')}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  )
}

export default HealthProfileCTA

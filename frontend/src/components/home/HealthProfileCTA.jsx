import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import { useLanguage } from '../../context/LanguageContext'

function HealthProfileCTA() {
  const { t } = useLanguage()

  return (
    <section className="pt-4">
      <GlassCard className="home-health-cta overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">{t('homeHealthKicker', 'Personal health')}</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t('homeHealthTitle', 'Keep your health information organized')}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {t('homeHealthDescription', 'Keep your medical history, prescriptions, reports, doctor visits, and emergency contacts together.')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Medical history</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Prescriptions</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Reports</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Doctor visits</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4">
            <Link
              to="/health"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/15 px-5 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/20"
            >
              {t('myHealth', 'Open My Health')}
              <ArrowRight size={16} />
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-200">
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

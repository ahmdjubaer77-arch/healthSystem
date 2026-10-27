import { Link } from 'react-router-dom'
import { HeartPulse, MapPin, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="glass-panel mt-8 rounded-[30px] border border-white/15 p-5 sm:p-8">
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-100">
              <HeartPulse size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.14em] text-cyan-100 uppercase">BD Health</div>
              <div className="text-[10px] text-slate-300">{t('brandTagline', 'Digital Health & Emergency Platform')}</div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            {t('footerDescription', 'Bangladesh-focused digital health services for personal record management, emergency information, and blood donor listings.')}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">{t('navigation', 'Navigation')}</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link to="/" className="hover:text-white">{t('home')}</Link></li>
            <li><Link to="/health" className="hover:text-white">{t('health')}</Link></li>
            <li><Link to="/blood" className="hover:text-white">{t('blood')}</Link></li>
            <li><Link to="/hospitals" className="hover:text-white">{t('hospitals')}</Link></li>
            <li><Link to="/doctors" className="hover:text-white">{t('doctors')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">{t('emergency', 'Emergency information')}</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><a href="tel:16263" className="hover:text-white">{t('healthBatayonNumber', 'Health Batayon: 16263')}</a></li>
            <li><a href="tel:999" className="hover:text-white">{t('emergency999', 'National emergency number: 999')}</a></li>
            <li><Link to="/emergency" className="hover:text-white">{t('emergencyHelp', 'View emergency information')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">{t('legal', 'Privacy')}</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link to="/privacy" className="hover:text-white">{t('privacy', 'Privacy')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-300" />
          <span>{t('prototypeNotice', 'Some features are still in development. Confirm directory information with providers.')}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={14} />
          <span>{t('prototypeLocation', 'Bangladesh-focused')}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer

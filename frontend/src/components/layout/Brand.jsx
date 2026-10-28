import { Link } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

function Brand() {
  const { t } = useLanguage()

  return (
    <Link to="/" className="navbar-brand flex min-w-0 shrink-0 items-center gap-2.5 rounded-2xl border border-transparent px-1 py-1 transition hover:border-white/10 hover:bg-white/5 sm:gap-3">
      <div className="navbar-brand-mark flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-100 sm:h-11 sm:w-11">
        <HeartPulse size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="navbar-wordmark whitespace-nowrap text-[11px] font-bold tracking-[0.08em] text-cyan-100 sm:text-xs">
          Nirogix <span className="navbar-wordmark-x">X</span>
        </div>
        <div className="hidden whitespace-nowrap text-[10px] text-slate-300 sm:block">{t('brandTagline', 'Your Health, Connected.')}</div>
      </div>
    </Link>
  )
}

export default Brand

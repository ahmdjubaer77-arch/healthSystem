import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function Brand() {
  const { t } = useLanguage()

  return (
    <Link
      to="/"
      className="navbar-brand group flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-1 py-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 sm:gap-2.5"
    >
      <img
        className="navbar-brand-mark h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
        src="/nirogix-x-mark.svg"
        alt=""
        aria-hidden="true"
      />
      <div className="min-w-0 leading-none">
        <div className="navbar-wordmark whitespace-nowrap text-[17px] font-extrabold tracking-[-0.045em] sm:text-[19px]">
          Nirogix<span className="navbar-wordmark-x ml-0.5">X</span>
        </div>
        <div className="navbar-tagline mt-1 hidden whitespace-nowrap text-[8px] font-medium tracking-[0.13em] sm:block sm:text-[9px]">
          {t('brandTagline', 'Your Health, Connected.')}
        </div>
      </div>
    </Link>
  )
}

export default Brand

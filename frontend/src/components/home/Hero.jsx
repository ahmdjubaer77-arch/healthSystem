import { ArrowDown, ArrowRight, HeartPulse, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function Hero() {
  const { language, t } = useLanguage()

  return (
    <section className={`home-hero ${language === 'bn' ? 'is-bangla' : ''}`} aria-labelledby="home-hero-title">
      <div className="home-hero-copy">
        <p className="home-hero-kicker">{t('homeHeroKicker', 'Healthcare, all in one place')}</p>
        <h1 id="home-hero-title">{t('homeHeroTitle', 'Healthcare, made simple.')}</h1>
        {language === 'en' && <p className="home-hero-bangla" lang="bn">আপনার স্বাস্থ্যসেবা, এখন আরও সহজ</p>}
        <p className="home-hero-description">
          {t('homeHeroDescription', 'Find hospitals, doctors, medicines and blood support. Keep your personal health information organized in one place.')}
        </p>
        <div className="home-hero-actions">
          <a className="home-primary-action" href="#quick-access">
            {t('homeHeroFindService', 'Explore services')} <ArrowDown size={16} aria-hidden="true" />
          </a>
          <Link className="home-secondary-action" to="/health">
            {t('myHealth', 'My Health')} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <aside className="home-hero-visual" aria-label={t('homeHeroFeatures', 'Healthcare features')}>
        <div className="home-hero-orbit" aria-hidden="true">
          <span className="home-hero-orbit-icon home-hero-orbit-icon-main"><HeartPulse size={25} /></span>
          <span className="home-hero-orbit-icon home-hero-orbit-icon-pin"><MapPin size={19} /></span>
          <span className="home-hero-orbit-icon home-hero-orbit-icon-shield"><ShieldCheck size={19} /></span>
        </div>
        <div className="home-hero-feature-card">
          <span className="home-hero-feature-mark" aria-hidden="true"><ShieldCheck size={18} /></span>
          <div>
            <p className="home-hero-feature-title">{t('homeHeroFeatureTitle', 'Care that keeps you in control')}</p>
            <p>{t('homeHeroFeatureDescription', 'Explore local services and manage your health information securely.')}</p>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default Hero

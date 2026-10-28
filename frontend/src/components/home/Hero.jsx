import { ArrowDown, ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

function Hero() {
  const { language, t } = useLanguage()

  return (
    <section className={`home-hero ${language === 'bn' ? 'is-bangla' : ''}`} aria-labelledby="home-hero-title">
      <div className="home-hero-copy">
        <p className="home-hero-kicker">Nirogix <span aria-hidden="true">/</span> বাংলাদেশ</p>
        <h1 id="home-hero-title">{t('homeHeroTitle', 'Find the care you need, closer to home.')}</h1>
        {language === 'en' && <p className="home-hero-bangla" lang="bn">আপনার এলাকার স্বাস্থ্যসেবা খুঁজুন</p>}
        <p className="home-hero-description">
          {t('homeHeroDescription', 'Search hospitals, doctors, blood support and transport by division, district and upazila. Listings may not always be up to date.')}
        </p>
        <div className="home-hero-actions">
          <a className="home-primary-action" href="#quick-access">
            {t('homeHeroFindService', 'Find a service')} <ArrowDown size={16} aria-hidden="true" />
          </a>
          <Link className="home-secondary-action" to="/emergency">
            {t('homeHeroEmergency', 'Emergency information')} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <aside className="home-hero-location" aria-label="Location-based search">
        <span className="home-hero-location-icon" aria-hidden="true"><MapPin size={19} /></span>
        <div>
          <p>{t('homeLocationLabel', 'Search by your area')}</p>
          <span>{t('division', 'Division')} <i aria-hidden="true">/</i> {t('district', 'District')} <i aria-hidden="true">/</i> {t('upazila', 'Upazila')}</span>
        </div>
      </aside>
    </section>
  )
}

export default Hero

import { Info, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

function TrustSection() {
  const { t } = useLanguage()

  return (
    <section className="home-trust-section" aria-labelledby="home-trust-title">
      <div className="home-trust-heading">
        <span className="home-trust-mark" aria-hidden="true"><ShieldCheck size={18} /></span>
        <div>
          <p className="home-section-kicker">{t('homeTrustKicker', 'Using health information')}</p>
          <h2 id="home-trust-title" className="home-section-title">{t('homeTrustTitle', 'Clear information, with care')}</h2>
        </div>
      </div>
      <div className="home-trust-copy">
        <p>{t('homeTrustDirectory', 'Directory information may change. Contact a provider to confirm services, hours and availability before travelling.')}</p>
        <p><Info size={15} aria-hidden="true" /> {t('homeTrustNotice', 'Nirogix is a directory and record-keeping platform, not an emergency dispatch service or a substitute for clinical advice.')}</p>
      </div>
    </section>
  )
}

export default TrustSection

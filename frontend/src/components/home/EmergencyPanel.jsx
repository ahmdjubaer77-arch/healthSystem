import { Ambulance, Building2, Droplets, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const actions = [
  { Icon: Building2, key: 'homeFindHospitals', label: 'Find hospitals', href: '/hospitals' },
  { Icon: Ambulance, key: 'homeAmbulanceListings', label: 'Browse ambulance listings', href: '/ambulances' },
  { Icon: Droplets, key: 'homeBloodSupport', label: 'Find blood support', href: '/blood' },
  { Icon: Info, key: 'homeEmergencyInfo', label: 'Emergency information', href: '/emergency' },
]

function EmergencyPanel() {
  const { t } = useLanguage()

  return (
    <section className="home-emergency-section" aria-labelledby="home-emergency-title">
      <div className="home-emergency-heading">
        <div>
          <p className="home-section-kicker">{t('homeEmergencyKicker', 'Urgent care directory')}</p>
          <h2 id="home-emergency-title" className="home-section-title">{t('homeEmergencyTitle', 'Find emergency-related services')}</h2>
        </div>
      </div>

      <div className="home-emergency-links">
        {actions.map(({ Icon, key, label, href }) => (
          <Link key={href} to={href} className="home-emergency-link">
            <span className="home-emergency-icon" aria-hidden="true"><Icon size={19} /></span>
            <span>{t(key, label)}</span>
            <span className="home-emergency-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      <p className="home-emergency-note">
        {t('homeEmergencyNotice', 'This directory does not dispatch emergency help. For immediate danger, contact local emergency services directly.')}
      </p>
    </section>
  )
}

export default EmergencyPanel

import { Ambulance, ArrowRight, Building2, Droplets, HeartPulse, Pill, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const services = [
  { key: 'medicines', label: 'Find medicines', detail: 'Check availability at nearby pharmacies', href: '/medicines', Icon: Pill },
  { key: 'hospitals', label: 'Hospitals', detail: 'Browse hospitals and care locations', href: '/hospitals', Icon: Building2 },
  { key: 'doctors', label: 'Doctors', detail: 'Explore doctors and specialties', href: '/doctors', Icon: Stethoscope },
  { key: 'blood', label: 'Blood donors', detail: 'Search donor listings by location', href: '/blood', Icon: Droplets },
  { key: 'emergencyTransport', label: 'Ambulances', detail: 'Browse ambulance service listings', href: '/ambulances', Icon: Ambulance },
  { key: 'myHealth', label: 'Your health record', detail: 'Organize your personal health information', href: '/health', Icon: HeartPulse },
]

function ServiceGrid() {
  const { t } = useLanguage()

  return (
    <section className="home-services-section" aria-labelledby="home-services-title">
      <header className="home-directory-header">
        <div>
          <p className="home-section-kicker">{t('homeServicesKicker', 'Healthcare directory')}</p>
          <h2 id="home-services-title" className="home-section-title">{t('homeServicesTitle', 'What do you need today?')}</h2>
        </div>
      </header>
      <div className="home-service-grid">
        {services.map(({ key, label, detail, href, Icon }) => (
          <Link key={href} to={href} className="home-service-card">
            <span className="home-service-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.8} /></span>
            <span className="home-service-copy">
              <span className="home-service-title">{t(key, label)}</span>
              <span className="home-service-detail">{t(`homeService${key}`, detail)}</span>
            </span>
            <ArrowRight size={16} className="home-service-arrow" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ServiceGrid

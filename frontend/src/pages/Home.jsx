import { useEffect, useState } from 'react'
import { ArrowRight, MapPin, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import Hero from '../components/home/Hero'
import QuickSearch from '../components/home/QuickSearch'
import EmergencyPanel from '../components/home/EmergencyPanel'
import NearbyHospitals from '../components/home/NearbyHospitals'
import BloodFinderPreview from '../components/home/BloodFinderPreview'
import HealthProfileCTA from '../components/home/HealthProfileCTA'
import TrustSection from '../components/home/TrustSection'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getDoctors } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

function Home() {
  const { t } = useLanguage()
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState('')
  const [doctorReloadKey, setDoctorReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setDoctorError('')
    setLoadingDoctors(true)
    getDoctors({ availability: 'AVAILABLE', limit: 3 })
      .then((result) => {
        if (!Array.isArray(result?.doctors)) throw new Error('The doctor service returned invalid listing data.')
        if (active) setDoctors(result.doctors)
      })
      .catch((error) => { if (active) setDoctorError(error.message) })
      .finally(() => { if (active) setLoadingDoctors(false) })
    return () => { active = false }
  }, [doctorReloadKey])

  return (
    <div className="home-page space-y-8 pb-6">
      <Hero />
      <QuickSearch />
      <EmergencyPanel />

      <section className="home-featured-section" aria-labelledby="featured-doctors-title">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="home-section-kicker">{t('homeDoctorsKicker', 'Doctor directory')}</p>
            <h2 id="featured-doctors-title" className="home-section-title">{t('homeDoctorsTitle', 'Available doctors')}</h2>
          </div>
          <Link to="/doctors" className="home-section-link">
            {t('homeBrowseDoctors', 'Browse doctors')}
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingDoctors ? <LoadingState label={t('homeLoading', 'Loading doctors')} /> : doctorError ? (
          <ErrorState
            title={t('homeDoctorsError', 'Could not load doctor listings')}
            description={doctorError}
            action={(
              <button
                type="button"
                onClick={() => setDoctorReloadKey((current) => current + 1)}
                className="home-section-link"
              >
                {t('tryAgain', 'Try again')}
              </button>
            )}
          />
        ) : doctors.length ? <div className="home-doctor-grid">
          {doctors.map((doctor) => (
            <Link key={doctor.id} to={`/doctors/${doctor.id}`} className="home-doctor-link">
              <div className="flex items-center gap-3">
                <div className="home-doctor-icon" aria-hidden="true">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <div className="home-doctor-name">{doctor.name}</div>
                  <div className="home-doctor-specialty">{doctor.specialty}</div>
                </div>
              </div>
              <div className="home-doctor-location">
                <MapPin size={14} aria-hidden="true" />
                {doctor.upazila || doctor.district || doctor.division || t('homeLocationMissing', 'Location not listed')}
              </div>
              <div className="home-doctor-hospital">
                <Stethoscope size={14} aria-hidden="true" />
                {doctor.hospitalName || t('homeHospitalMissing', 'Hospital not listed')}
              </div>
            </Link>
          ))}
        </div> : <p className="home-empty-copy">{t('homeNoDoctors', 'No available doctors are listed right now.')}</p>}
      </section>

      <NearbyHospitals />
      <BloodFinderPreview />
      <HealthProfileCTA />
      <TrustSection />
    </div>
  )
}

export default Home

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import HospitalCard from '../hospitals/HospitalCard'
import { getPublicHospitals } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

function NearbyHospitals() {
  const { t } = useLanguage()
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHospitals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getPublicHospitals({ limit: 3 })
      if (!Array.isArray(result?.hospitals)) {
        throw new Error('The hospital service returned invalid listing data.')
      }
      setHospitals(result.hospitals)
    } catch (requestError) {
      setError(requestError.message)
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHospitals()
  }, [loadHospitals])

  return (
    <section className="home-directory-section" aria-labelledby="hospital-directory-title">
      <header className="home-directory-header">
        <div>
          <p className="home-section-kicker">{t('homeHospitalsKicker', 'Hospital directory')}</p>
          <h2 id="hospital-directory-title" className="home-section-title">{t('homeHospitalsTitle', 'Hospitals listed on BD Health')}</h2>
        </div>
        <Link to="/hospitals" className="home-section-link">
          {t('homeBrowseHospitals', 'Browse hospitals')} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <p role="status" className="home-feedback">{t('homeLoading', 'Loading hospital listings…')}</p>
      ) : error ? (
        <div className="home-feedback home-feedback-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadHospitals}>{t('tryAgain', 'Try again')}</button>
        </div>
      ) : hospitals.length === 0 ? (
        <p className="home-feedback">{t('homeNoHospitals', 'No hospital listings are available right now.')}</p>
      ) : (
        <>
          <p className="home-directory-note">{t('homeListingNotice', 'Listing information can change. Please confirm details with the provider.')}</p>
          <div className="home-hospital-grid">
            {hospitals.map((hospital) => <HospitalCard key={hospital.id} hospital={hospital} />)}
          </div>
        </>
      )}
    </section>
  )
}

export default NearbyHospitals

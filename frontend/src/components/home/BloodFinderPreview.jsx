import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BloodDonorCard from './BloodDonorCard'
import { getBloodDonors } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

function BloodFinderPreview() {
  const { t } = useLanguage()
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    getBloodDonors({ availableOnly: true, limit: 3 })
      .then((result) => {
        if (!Array.isArray(result?.donors)) throw new Error('The blood donor service returned invalid listing data.')
        if (current) setDonors(result.donors)
      })
      .catch((requestError) => { if (current) setError(requestError.message) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [reloadKey])

  return (
    <section className="home-blood-section pt-4">
      <div className="mb-6">
        <p className="home-section-kicker">{t('homeBloodKicker', 'Blood support')}</p>
        <h2 className="home-section-title">{t('homeBloodTitle', 'Find a blood donor')}</h2>
        <p className="home-section-description">{t('homeBloodDescription', 'Search registered donor listings by blood group and location.')}</p>
      </div>

      <Link to="/blood" className="home-section-link">
        {t('homeBrowseDonors', 'Find donors')} <ArrowRight size={15} />
      </Link>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {loading && <p role="status" className="home-feedback">{t('homeLoading', 'Loading donor listings…')}</p>}
        {!loading && error && (
          <div role="alert" className="home-feedback home-feedback-error">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)}>{t('tryAgain', 'Try again')}</button>
          </div>
        )}
        {!loading && !error && donors.length === 0 && <p className="home-feedback">{t('homeNoDonors', 'No available donor listings are available right now.')}</p>}
        {!loading && !error && donors.map((donor) => <BloodDonorCard key={donor.id} donor={donor} />)}
      </div>
    </section>
  )
}

export default BloodFinderPreview

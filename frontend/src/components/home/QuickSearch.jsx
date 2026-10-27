import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ambulance, ArrowRight, Building2, Droplet, MapPin, Search, Stethoscope } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import { searchCategories } from '../../data/mockData'
import { getPublicLocationOptions } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

const ROUTES = {
  hospitals: '/hospitals',
  blood: '/blood',
  doctors: '/doctors',
  ambulance: '/ambulances',
}

const EMPTY_LOCATION_OPTIONS = { divisions: [], districts: [], upazilas: [], areas: [] }

const SERVICE_PRESENTATION = {
  hospitals: { titleKey: 'hospitals', title: 'Hospitals', detailKey: 'homeFindCareNearby', detail: 'Find care nearby', Icon: Building2 },
  blood: { titleKey: 'blood', title: 'Blood', detailKey: 'homeBloodSupport', detail: 'Find blood support', Icon: Droplet },
  doctors: { titleKey: 'doctors', title: 'Doctors', detailKey: 'homeMeetSpecialist', detail: 'Meet a specialist', Icon: Stethoscope },
  ambulance: { titleKey: 'emergencyTransport', title: 'Ambulance', detailKey: 'homeArrangeTransport', detail: 'Arrange transport', Icon: Ambulance },
}

function QuickSearch() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState('hospitals')
  const [location, setLocation] = useState({ division: '', district: '', upazila: '', area: '' })
  const [options, setOptions] = useState(EMPTY_LOCATION_OPTIONS)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [optionsReloadKey, setOptionsReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoadingOptions(true)
    setOptionsError('')
    setOptions(EMPTY_LOCATION_OPTIONS)
    getPublicLocationOptions(selectedCategory, { division: location.division, district: location.district, upazila: location.upazila })
      .then((result) => {
        const fields = ['divisions', 'districts', 'upazilas', 'areas']
        if (!result || fields.some((field) => !Array.isArray(result[field]))) {
          throw new Error('The location service returned invalid options.')
        }
        if (active) setOptions(result)
      })
      .catch((error) => { if (active) setOptionsError(error.message) })
      .finally(() => { if (active) setLoadingOptions(false) })
    return () => { active = false }
  }, [location.division, location.district, location.upazila, optionsReloadKey, selectedCategory])

  const selectCategory = (category) => {
    setSelectedCategory(category)
    setLocation({ division: '', district: '', upazila: '', area: '' })
  }

  const updateLocation = (field, value) => {
    setLocation((current) => {
      if (field === 'division') return { division: value, district: '', upazila: '', area: '' }
      if (field === 'district') return { ...current, district: value, upazila: '', area: '' }
      if (field === 'upazila') return { ...current, upazila: value, area: '' }
      return { ...current, [field]: value }
    })
  }

  const handleSearch = (event) => {
    event.preventDefault()
    if (!ROUTES[selectedCategory]) return
    const params = new URLSearchParams({ category: selectedCategory })
    Object.entries(location).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    navigate(`${ROUTES[selectedCategory]}?${params.toString()}`)
  }

  return (
    <GlassCard id="quick-access" className="quick-access-shell">
      <div className="quick-access-content">
        <header className="quick-access-heading">
          <div>
            <p className="quick-access-eyebrow">{t('homeDirectoryKicker', 'Healthcare directory')}</p>
            <h2>{t('homeSearchTitle', 'Find healthcare near you')}</h2>
            <p>{t('homeSearchDescription', 'Choose a service, then narrow your search by location.')}</p>
          </div>
          <span className="quick-access-heading-mark" aria-hidden="true"><MapPin size={18} /></span>
        </header>

        <div className="quick-service-grid" role="group" aria-label={t('homeChooseService', 'Choose a healthcare service')}>
          {searchCategories.map((category) => {
            const service = SERVICE_PRESENTATION[category.id]
            if (!service) return null
            const Icon = service.Icon
            const isSelected = selectedCategory === category.id
            const title = t(service.titleKey, service.title)
            const detail = t(service.detailKey, service.detail)

            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectCategory(category.id)}
                className={`quick-service-card ${isSelected ? 'is-selected' : ''}`}
              >
                <span className="quick-service-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="quick-service-copy">
                  <span className="quick-service-title">{title}</span>
                  <span className="quick-service-detail">{detail}</span>
                </span>
                <span className="quick-service-indicator" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSearch} className="quick-location-panel">
          <div className="quick-location-heading">
            <span className="quick-location-pin"><MapPin size={16} aria-hidden="true" /></span>
            <div>
              <h3>{t('homeSearchByLocation', 'Search by location')}</h3>
              <p>{t('homeRefineArea', 'Refine results by your area')}</p>
            </div>
          </div>

          <div className="quick-location-fields">
            <label className="quick-location-field" htmlFor="quick-division">
              <span>{t('division', 'Division')}</span>
              <select
                id="quick-division"
                value={location.division}
                onChange={(event) => updateLocation('division', event.target.value)}
                disabled={loadingOptions || options.divisions.length === 0}
              >
                <option value="">{t('homeAnyDivision', 'Any division')}</option>
                {options.divisions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label className="quick-location-field" htmlFor="quick-district">
              <span>{t('district', 'District')}</span>
              <select
                id="quick-district"
                value={location.district}
                onChange={(event) => updateLocation('district', event.target.value)}
                disabled={loadingOptions || !location.division || options.districts.length === 0}
              >
                <option value="">{t('homeAnyDistrict', 'Any district')}</option>
                {options.districts.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label className="quick-location-field" htmlFor="quick-upazila">
              <span>{t('upazila', 'Upazila')}</span>
              <select
                id="quick-upazila"
                value={location.upazila}
                onChange={(event) => updateLocation('upazila', event.target.value)}
                disabled={loadingOptions || !location.district || options.upazilas.length === 0}
              >
                <option value="">{t('homeAnyUpazila', 'Any upazila')}</option>
                {options.upazilas.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label className="quick-location-field" htmlFor="quick-area">
              <span>{t('area', 'Area')}</span>
              <select
                id="quick-area"
                value={location.area}
                onChange={(event) => updateLocation('area', event.target.value)}
                disabled={selectedCategory !== 'ambulance' || loadingOptions || !location.upazila || options.areas.length === 0}
              >
                <option value="">{selectedCategory === 'ambulance' ? t('homeAnyServiceArea', 'Any service area') : t('homeUnavailable', 'Not available')}</option>
                {options.areas.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <button type="submit" className="quick-location-submit" disabled={loadingOptions}>
              <Search size={17} aria-hidden="true" />
              <span>{loadingOptions ? t('homeLoading', 'Loading...') : t('homeSearch', 'Search')}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          {optionsError && (
            <p role="alert" className="quick-location-message is-error">
              <span>{optionsError}</span>
              <button type="button" onClick={() => setOptionsReloadKey((current) => current + 1)}>
                {t('homeRetryOptions', 'Retry location options')}
              </button>
            </p>
          )}
          {!loadingOptions && !optionsError && options.divisions.length === 0 && (
            <p role="status" className="quick-location-message">
              {t('homeLocationOptionsEmpty', 'Location filters are not available for this service yet. Search without a location.')}
            </p>
          )}
        </form>
      </div>
    </GlassCard>
  )
}

export default QuickSearch

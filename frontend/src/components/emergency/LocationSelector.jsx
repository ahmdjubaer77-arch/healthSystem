import { LocateFixed, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import GlassCard from '../common/GlassCard'
import { getPublicLocationOptions } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

const EMPTY_OPTIONS = { divisions: [], districts: [], upazilas: [], areas: [] }
const LOCATION_FIELDS = ['division', 'district', 'upazila', 'area']

function LocationSelector({ selectedLocation, onChange }) {
  const { t } = useLanguage()
  const [options, setOptions] = useState(EMPTY_OPTIONS)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [optionsReloadKey, setOptionsReloadKey] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [permissionState, setPermissionState] = useState('Location has not been requested')

  useEffect(() => {
    let active = true
    setLoadingOptions(true)
    setOptionsError('')
    setOptions(EMPTY_OPTIONS)

    getPublicLocationOptions('ambulance', {
      division: selectedLocation.division,
      district: selectedLocation.district,
      upazila: selectedLocation.upazila,
    }).then((result) => {
      if (!result || LOCATION_FIELDS.some((field) => !Array.isArray(result[`${field}s`]))) {
        throw new Error('The location service returned invalid options.')
      }
      if (active) setOptions(result)
    }).catch((error) => {
      if (active) setOptionsError(error.message)
    }).finally(() => {
      if (active) setLoadingOptions(false)
    })

    return () => { active = false }
  }, [optionsReloadKey, selectedLocation.district, selectedLocation.division, selectedLocation.upazila])

  const updateLocation = (field, value) => {
    const nextLocation = { ...selectedLocation, [field]: value, approx: '' }
    if (field === 'division') {
      nextLocation.district = ''
      nextLocation.upazila = ''
      nextLocation.area = ''
    } else if (field === 'district') {
      nextLocation.upazila = ''
      nextLocation.area = ''
    } else if (field === 'upazila') {
      nextLocation.area = ''
    }
    onChange(nextLocation)
  }

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setPermissionState('Location is unavailable on this device')
      return
    }

    setIsLocating(true)
    setPermissionState('Requesting location permission…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({
          ...selectedLocation,
          approx: `Approx. ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        })
        setPermissionState('Approximate coordinates stay on this device until you choose to share them')
        setIsLocating(false)
      },
      (error) => {
        setPermissionState(error.code === 1
          ? 'Location permission was denied. You can still choose an area manually'
          : 'Unable to retrieve location. You can still choose an area manually')
        setIsLocating(false)
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    )
  }

  const selectedArea = selectedLocation.approx || LOCATION_FIELDS
    .map((field) => selectedLocation[field])
    .filter(Boolean)
    .join(', ') || 'No location selected'

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">Location</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Choose an area</h2>
          <p className="mt-1 text-sm text-slate-300">Location is not requested automatically.</p>
        </div>
        <button
          type="button"
          onClick={handleNearMe}
          disabled={isLocating}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-wait disabled:opacity-60"
        >
          <LocateFixed size={14} aria-hidden="true" />
          {isLocating ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'division', label: 'Division', placeholder: 'Any division', choices: options.divisions, disabled: false },
          { key: 'district', label: 'District', placeholder: 'Any district', choices: options.districts, disabled: !selectedLocation.division },
          { key: 'upazila', label: 'Upazila', placeholder: 'Any upazila', choices: options.upazilas, disabled: !selectedLocation.district },
          { key: 'area', label: 'Service area', placeholder: 'Any service area', choices: options.areas, disabled: !selectedLocation.upazila },
        ].map(({ key, label, placeholder, choices, disabled }) => (
          <label key={key} className="block text-sm text-slate-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
            <select
              value={selectedLocation[key] || ''}
              onChange={(event) => updateLocation(key, event.target.value)}
              disabled={loadingOptions || disabled || choices.length === 0}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{placeholder}</option>
              {choices.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        ))}
      </div>

      {!loadingOptions && !optionsError && options.divisions.length === 0 && (
        <p className="mt-4 text-sm text-slate-300" role="status">
          {t('emergencyNoAreas', 'No verified ambulance service locations are listed right now.')}
        </p>
      )}

      {optionsError && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-rose-200" role="alert">
          <span>{optionsError}</span>
          <button type="button" onClick={() => setOptionsReloadKey((current) => current + 1)} className="underline underline-offset-2">
            Retry location options
          </button>
        </div>
      )}

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
        <MapPin size={16} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" />
        <div aria-live="polite">
          <div className="font-medium text-white">{selectedArea}</div>
          <div className="mt-1 text-xs text-slate-300">{permissionState}</div>
        </div>
      </div>
    </GlassCard>
  )
}

export default LocationSelector

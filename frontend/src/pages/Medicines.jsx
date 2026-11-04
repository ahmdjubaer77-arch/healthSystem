import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock3, Mail, MapPin, Phone, Search } from 'lucide-react'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import { searchMedicineAvailability } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

const PAGE_SIZE = 20

function formatUpdatedAt(value, language) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Availability date unavailable'
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function Medicines() {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [searchText, setSearchText] = useState(initialSearch)
  const [locationText, setLocationText] = useState(searchParams.get('location') || '')
  const [filters, setFilters] = useState({ search: initialSearch, location: searchParams.get('location') || '' })
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    setSearchText(search)
    setLocationText(location)
    setFilters({ search, location })
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    searchMedicineAvailability({ ...filters, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!Array.isArray(result?.medicines) || !result?.pagination) {
          throw new Error('The medicine service returned invalid listing data.')
        }
        if (!active) return
        setRecords(result.medicines)
        setPagination(result.pagination)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filters, page, reloadKey])

  const submitSearch = (event) => {
    event.preventDefault()
    const nextFilters = { search: searchText.trim(), location: locationText.trim() }
    setFilters(nextFilters)
    const nextParams = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) nextParams.set(key, value)
    })
    setSearchParams(nextParams, { replace: true })
    setPage(1)
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker={t('medicines', 'Medicines')}
        title={t('medicineSearchTitle', 'Check medicine availability')}
        subtitle={t('medicineSearchDescription', 'Find medicines listed by verified pharmacies and contact the pharmacy to confirm current stock.')}
      />

      <GlassCard className="p-4 sm:p-6">
        <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-end">
          <label className="block text-sm font-medium text-[var(--page-text)]">
            <span className="mb-2 block">{t('medicineNameLabel', 'Medicine name or generic')}</span>
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              maxLength={120}
              placeholder={t('medicineSearchPlaceholder', 'Search by medicine name')}
              className="h-11 w-full rounded-xl border border-[var(--page-border)] bg-[var(--page-surface)] px-3 text-sm text-[var(--page-text)] outline-none transition focus:border-[var(--page-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--page-accent)_16%,transparent)]"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--page-text)]">
            <span className="mb-2 block">{t('location', 'Location')}</span>
            <input
              type="search"
              value={locationText}
              onChange={(event) => setLocationText(event.target.value)}
              maxLength={120}
              placeholder={t('medicineLocationPlaceholder', 'Division, district or upazila')}
              className="h-11 w-full rounded-xl border border-[var(--page-border)] bg-[var(--page-surface)] px-3 text-sm text-[var(--page-text)] outline-none transition focus:border-[var(--page-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--page-accent)_16%,transparent)]"
            />
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--page-text)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#343437] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] focus-visible:ring-offset-2">
            <Search size={16} aria-hidden="true" />
            {t('homeSearch', 'Search')}
          </button>
        </form>
        <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">
          {t('medicineAvailabilityNotice', 'Availability can change. Call the pharmacy before travelling. This directory does not provide prescriptions or medical advice.')}
        </p>
      </GlassCard>

      {error && <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
      {loading && <LoadingState label={t('medicineLoading', 'Loading medicine listings')} />}
      {!loading && !error && records.length === 0 && (
        <EmptyState
          title={t('medicineNoResults', 'No medicine listings found')}
          description={t('medicineNoResultsDescription', 'Try another name or location, or check back later.')}
        />
      )}
      {!loading && !error && records.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {records.map((record) => (
              <GlassCard key={record.id} className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--page-text)]">{record.name}</h2>
                    {record.genericName && <p className="mt-1 text-sm text-[var(--page-muted)]">{record.genericName}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    record.availability === 'AVAILABLE'
                      ? 'border-emerald-700/20 bg-emerald-50 text-emerald-800'
                      : 'border-amber-700/20 bg-amber-50 text-amber-800'
                  }`}>
                    {record.availability === 'AVAILABLE'
                      ? t('available', 'Available')
                      : t('medicineUnavailable', 'Unavailable')}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--page-text)]">{record.strength} · {record.dosageForm}</p>
                <div className="mt-4 rounded-xl bg-[var(--page-surface-sunken)] p-3">
                  <p className="font-medium text-[var(--page-text)]">{record.pharmacy.name}</p>
                  <p className="mt-1 flex items-start gap-2 text-sm leading-5 text-[var(--page-muted)]">
                    <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{[record.pharmacy.address, record.pharmacy.upazila, record.pharmacy.district, record.pharmacy.division].filter(Boolean).join(', ') || t('notProvided', 'Location not listed')}</span>
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-[var(--page-muted)]">
                    <Clock3 size={14} aria-hidden="true" />
                    {t('medicineUpdated', 'Updated')} {formatUpdatedAt(record.updatedAt, language)}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {record.pharmacy.contactPhone && (
                    <a href={`tel:${record.pharmacy.contactPhone}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] transition-colors hover:bg-[var(--page-surface-sunken)]">
                      <Phone size={15} aria-hidden="true" /> {t('homeCall', 'Call pharmacy')}
                    </a>
                  )}
                  {record.pharmacy.contactEmail && (
                    <a href={`mailto:${record.pharmacy.contactEmail}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] transition-colors hover:bg-[var(--page-surface-sunken)]">
                      <Mail size={15} aria-hidden="true" /> {t('medicineEmail', 'Email')}
                    </a>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--page-muted)]">
            <span>{pagination.total} {t('medicineListings', 'listings')}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-lg border border-[var(--page-border)] px-3 disabled:opacity-40">{t('previous', 'Previous')}</button>
              <span>{page} / {Math.max(pagination.pages, 1)}</span>
              <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-[var(--page-border)] px-3 disabled:opacity-40">{t('next', 'Next')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Medicines

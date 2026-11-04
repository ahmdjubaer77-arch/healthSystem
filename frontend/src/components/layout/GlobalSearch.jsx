import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const searchAreas = [
  { id: 'medicines', path: '/medicines', label: 'Medicines' },
  { id: 'hospitals', path: '/hospitals', label: 'Hospitals' },
  { id: 'doctors', path: '/doctors', label: 'Doctors' },
  { id: 'blood', path: '/blood', label: 'Blood donors' },
  { id: 'ambulance', path: '/ambulances', label: 'Ambulances' },
]

function GlobalSearch() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [area, setArea] = useState(searchAreas[0].id)
  const searchRef = useRef(null)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const selectedArea = searchAreas.find((item) => item.id === area) || searchAreas[0]

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    searchRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const submitSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    const search = params.toString()
    navigate(`${selectedArea.path}${search ? `?${search}` : ''}`)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="navbar-search-trigger"
        aria-label={t('navbarSearch', 'Search services')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search size={17} aria-hidden="true" />
        <span className="navbar-search-label">{t('navbarSearch', 'Search')}</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="navbar-search-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
              triggerRef.current?.focus()
            }
          }}
        >
          <section ref={dialogRef} className="navbar-search-dialog" role="dialog" aria-modal="true" aria-labelledby="navbar-search-title">
            <header className="navbar-search-heading">
              <div>
                <p id="navbar-search-title">{t('navbarSearchTitle', 'Search the directory')}</p>
                <span>{t('navbarSearchHint', 'Choose a service and search its listings.')}</span>
              </div>
              <button
                type="button"
                className="navbar-search-close"
                onClick={() => {
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                aria-label={t('close', 'Close')}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="navbar-search-areas" role="group" aria-label={t('navbarSearchArea', 'Choose a service')}>
              {searchAreas.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={area === item.id}
                  className={`navbar-search-area${area === item.id ? ' is-active' : ''}`}
                  onClick={() => setArea(item.id)}
                >
                  {t(item.id === 'ambulance' ? 'emergencyTransport' : item.id, item.label)}
                </button>
              ))}
            </div>

            <form className="navbar-search-form" onSubmit={submitSearch}>
              <Search size={18} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                placeholder={t('navbarSearchPlaceholder', 'Search medicines, hospitals, doctors, donors…')}
                aria-label={t('navbarSearchPlaceholder', 'Search directory listings')}
              />
              <button type="submit" aria-label={`${t('homeSearch', 'Search')} ${t(selectedArea.id === 'ambulance' ? 'emergencyTransport' : selectedArea.id, selectedArea.label)}`}>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>

            <p className="navbar-search-footnote">
              {t('navbarSearchSelected', 'Searching')}: <strong>{t(selectedArea.id === 'ambulance' ? 'emergencyTransport' : selectedArea.id, selectedArea.label)}</strong>
            </p>
          </section>
        </div>
      )}
    </>
  )
}

export default GlobalSearch

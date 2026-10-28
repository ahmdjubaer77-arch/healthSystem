import { useEffect, useRef } from 'react'
import {
  CalendarDays,
  ClipboardList,
  FileClock,
  FileText,
  HeartPulse,
  Hospital,
  Menu,
  MoreHorizontal,
  Pill,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Syringe,
  X,
} from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../common/GlassCard'

const mobileItems = [
  { id: 'overview', label: 'Overview', target: 'overview' },
  { id: 'medical-timeline', label: 'Timeline', target: 'medical-timeline' },
  { id: 'medications', label: 'Medicines', target: 'medications' },
  { id: 'documents', label: 'Documents', target: 'documents' },
]

const sectionGroups = {
  overview: 'overview',
  'emergency-info': 'overview',
  'medical-timeline': 'medical-timeline',
  'doctor-visits': 'medical-timeline',
  'hospital-visits': 'medical-timeline',
  medications: 'medications',
  prescriptions: 'medications',
  reports: 'documents',
  documents: 'documents',
  vaccinations: 'documents',
}

const sectionIcons = {
  overview: HeartPulse,
  'emergency-info': ShieldAlert,
  'medical-timeline': CalendarDays,
  medications: Pill,
  prescriptions: ClipboardList,
  reports: FileText,
  'doctor-visits': Stethoscope,
  'hospital-visits': Hospital,
  vaccinations: Syringe,
  documents: FileText,
  'shared-with-me': Share2,
  'sharing-consent': ShieldCheck,
  'access-history': FileClock,
}

function HealthSidebar({ items, activeSection, onSelect }) {
  const navRef = useRef(null)
  const buttonRefs = useRef(new Map())
  const [moreOpen, setMoreOpen] = useState(false)
  const activeGroup = sectionGroups[activeSection] || 'more'

  useEffect(() => {
    const nav = navRef.current
    const activeButton = buttonRefs.current.get(activeSection)
    if (!nav || !activeButton || nav.scrollWidth <= nav.clientWidth) return

    const navBounds = nav.getBoundingClientRect()
    const buttonBounds = activeButton.getBoundingClientRect()
    const left = nav.scrollLeft + buttonBounds.left - navBounds.left - (nav.clientWidth - buttonBounds.width) / 2
    nav.scrollTo({
      left,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [activeSection])

  useEffect(() => {
    if (!moreOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [moreOpen])

  const selectSection = (sectionId) => {
    setMoreOpen(false)
    onSelect(sectionId)
  }

  return (
    <>
      <div className="health-section-desktop">
        <GlassCard className="health-section-nav min-w-0 p-2.5 sm:p-3 xl:p-4">
          <nav ref={navRef} aria-label="Health sections" className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] xl:flex-col xl:overflow-visible xl:pb-0">
            {items.map((item) => {
              const isActive = activeSection === item.id
              const Icon = sectionIcons[item.id] || FileText

              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    if (node) buttonRefs.current.set(item.id, node)
                    else buttonRefs.current.delete(item.id)
                  }}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`health-section-tab group min-h-11 shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 xl:w-full ${
                    isActive
                      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
                      : 'border-white/10 bg-slate-950/20 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="health-section-tab-content flex items-center justify-center gap-2 xl:justify-start">
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </GlassCard>
      </div>

      <div className="health-mobile-navigation">
        {moreOpen && (
          <>
            <button
              type="button"
              className="health-mobile-backdrop"
              onClick={() => setMoreOpen(false)}
              aria-label="Close health sections menu"
            />
            <div className="health-mobile-more-panel" role="dialog" aria-label="All health sections">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">All health sections</h2>
                  <p className="mt-0.5 text-xs text-slate-400">Choose a section to jump to</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid max-h-[min(48dvh,24rem)] grid-cols-3 gap-2 overflow-y-auto overscroll-contain">
                {items.map(({ id, label }) => {
                  const Icon = sectionIcons[id] || FileText
                  const isActive = activeSection === id

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectSection(id)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`health-mobile-more-item ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <nav className="health-mobile-bottom-bar" aria-label="Health navigation">
          {mobileItems.map(({ id, label, target }) => {
            const Icon = sectionIcons[id] || FileText
            const isActive = activeGroup === id

            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(target)}
                aria-current={isActive ? 'location' : undefined}
                className={`health-mobile-bottom-item ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label={moreOpen ? 'Close health sections' : 'More health sections'}
            className={`health-mobile-bottom-item ${activeGroup === 'more' || moreOpen ? 'is-active' : ''}`}
          >
            {moreOpen ? <Menu size={19} aria-hidden="true" /> : <MoreHorizontal size={19} aria-hidden="true" />}
            <span>More</span>
          </button>
        </nav>
      </div>
    </>
  )
}

export default HealthSidebar

import { useEffect, useRef } from 'react'
import GlassCard from '../common/GlassCard'

function HealthSidebar({ items, activeSection, onSelect }) {
  const navRef = useRef(null)
  const buttonRefs = useRef(new Map())

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

  return (
    <GlassCard className="health-section-nav min-w-0 p-2.5 sm:p-3 xl:p-4">
      <nav ref={navRef} aria-label="Health sections" className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] xl:flex-col xl:overflow-visible xl:pb-0">
        {items.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) buttonRefs.current.set(item.id, node)
                else buttonRefs.current.delete(item.id)
              }}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'location' : undefined}
              className={`health-section-tab min-h-11 shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 xl:w-full ${
                isActive
                  ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
                  : 'border-white/10 bg-slate-950/20 text-slate-200 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </GlassCard>
  )
}

export default HealthSidebar

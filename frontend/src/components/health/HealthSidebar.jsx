import GlassCard from '../common/GlassCard'

function HealthSidebar({ items, activeSection, onSelect }) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:flex-col md:overflow-visible md:pb-0">
        {items.map((item) => {
          const sectionKey = item
            .toLowerCase()
            .replace(/&/g, '')
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/ /g, '-')
          const isActive = activeSection === sectionKey

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(sectionKey)}
              className={`whitespace-nowrap rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                isActive
                  ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
                  : 'border-white/10 bg-slate-950/20 text-slate-200 hover:bg-white/10'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}

export default HealthSidebar

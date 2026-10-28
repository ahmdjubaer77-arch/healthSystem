import * as icons from 'lucide-react'
import GlassCard from '../common/GlassCard'

function HealthSummary({ summaryItems }) {
  const IconMap = icons

  return (
    <section>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
        {summaryItems.map((item) => {
          const Icon = IconMap[item.icon] || IconMap.FileText

          return (
            <a
              key={item.id}
              href={`#${item.target}`}
              aria-label={`View ${item.count} ${item.label.toLowerCase()}`}
              className="group block min-w-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <GlassCard className="h-full min-w-0 p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-cyan-300/40 group-hover:shadow-lg group-focus-visible:border-cyan-300/50 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-100">
                  <Icon size={18} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{item.count}</div>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-lg font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400 transition-colors group-hover:text-cyan-100">View details</p>
              </div>
              </GlassCard>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export default HealthSummary

import GlassCard from '../common/GlassCard'

function AppointmentStatus({ statuses, activeIndex, onChange }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Status preview</p>
      <div className="mt-4 grid gap-3">
        {statuses.map((status, index) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(index)}
            className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
              index === activeIndex
                ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
                : 'border-white/10 bg-slate-950/20 text-slate-200 hover:bg-white/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

export default AppointmentStatus

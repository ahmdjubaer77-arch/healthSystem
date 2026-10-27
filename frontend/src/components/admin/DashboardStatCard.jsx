function DashboardStatCard({ label, value, detail, icon: Icon, accent = 'cyan' }) {
  const accents = {
    cyan: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
    blue: 'border-blue-300/20 bg-blue-400/10 text-blue-100',
    emerald: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
    rose: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
    violet: 'border-violet-300/20 bg-violet-400/10 text-violet-100',
  }

  return (
    <article className="admin-stat-card h-full rounded-[20px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">{Number(value || 0).toLocaleString()}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:h-11 sm:w-11 ${accents[accent] || accents.cyan}`}>
          <Icon size={19} aria-hidden="true" />
        </div>
      </div>
      {detail && <p className="mt-4 text-xs text-slate-500">{detail}</p>}
    </article>
  )
}

export default DashboardStatCard

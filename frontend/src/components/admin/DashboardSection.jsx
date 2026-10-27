import EmptyState from '../common/EmptyState'

function DashboardSection({ title, description, children, action }) {
  return (
    <section className="admin-dashboard-section overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
      <header className="flex min-w-0 flex-col items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </header>
      <div className="min-w-0 p-4 sm:p-5">
        {children || <EmptyState title="No records available" description="No records are available for this section yet." />}
      </div>
    </section>
  )
}

export default DashboardSection

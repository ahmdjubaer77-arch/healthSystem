const statusStyles = {
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  danger: 'border-red-400/30 bg-red-500/15 text-red-200',
  info: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
  neutral: 'border-slate-300/20 bg-slate-400/10 text-slate-200',
  available: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  pending: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  verified: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  'not-verified': 'border-slate-300/20 bg-slate-400/10 text-slate-200',
  expired: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  private: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
  shared: 'border-violet-400/30 bg-violet-500/15 text-violet-100',
  revoked: 'border-red-400/30 bg-red-500/15 text-red-200',
  demo: 'border-slate-300/20 bg-slate-400/10 text-slate-200',
}

function StatusBadge({ status, label, variant = 'info', compact = false }) {
  const displayLabel = label || status || 'Unknown'
  const resolvedVariant = statusStyles[variant] ? variant : 'info'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusStyles[resolvedVariant]} ${
        compact ? 'text-[10px]' : ''
      }`}
    >
      {displayLabel}
    </span>
  )
}

export default StatusBadge

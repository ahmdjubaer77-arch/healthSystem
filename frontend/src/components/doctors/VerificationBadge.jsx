const toneMap = {
  VERIFIED: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
  PENDING: 'border-amber-300/25 bg-amber-500/10 text-amber-100',
  REJECTED: 'border-slate-300/25 bg-slate-500/10 text-slate-200',
  SUSPENDED: 'border-red-300/25 bg-red-500/10 text-red-100',
}

function VerificationBadge({ status = 'VERIFIED' }) {
  const label =
    status === 'VERIFIED' ? '✓ Verified' : status === 'PENDING' ? 'Verification Pending' : status === 'REJECTED' ? 'Rejected' : 'Suspended'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneMap[status] || toneMap.VERIFIED}`}>
      {label}
    </span>
  )
}

export default VerificationBadge

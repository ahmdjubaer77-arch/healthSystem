import { Clock3, Droplets, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

const urgencyLabels = {
  STANDARD: 'Standard',
  URGENT: 'Urgent',
  CRITICAL: 'Critical',
}

function formatDate(value) {
  if (!value) return 'Time not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Time not provided' : date.toLocaleString()
}

function BloodRequestCard({ request }) {
  return (
    <GlassCard className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--page-muted)]">Blood group</p>
          <h3 className="mt-1 text-2xl font-semibold text-[var(--page-text)]">{request.bloodGroup}</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
          request.urgency === 'CRITICAL'
            ? 'border-red-700/20 bg-red-50 text-red-800'
            : request.urgency === 'URGENT'
              ? 'border-amber-700/20 bg-amber-50 text-amber-800'
              : 'border-[var(--page-border)] bg-[var(--page-surface-sunken)] text-[var(--page-muted)]'
        }`}>
          {urgencyLabels[request.urgency] || urgencyLabels.STANDARD}
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-[var(--page-text)]">
        <p className="flex items-center gap-2"><Droplets size={15} className="text-[var(--page-emergency)]" aria-hidden="true" />{request.quantity} {request.unit} required</p>
        <p className="flex items-center gap-2"><MapPin size={15} className="text-[var(--page-accent)]" aria-hidden="true" />{[request.hospitalName, request.upazila, request.district].filter(Boolean).join(' · ') || 'Location not listed'}</p>
        <p className="flex items-center gap-2"><Clock3 size={15} className="text-[var(--page-muted)]" aria-hidden="true" />Required by {formatDate(request.requiredAt)}</p>
      </div>

      <div className="mt-auto pt-5">
        {request.contactPhone && (
          <a href={`tel:${request.contactPhone}`} className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] transition-colors hover:bg-[var(--page-surface-sunken)]">
            <Phone size={15} aria-hidden="true" /> Contact requester
          </a>
        )}
        <Link to={`/blood/requests/${request.id}`} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[var(--page-text)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#343437] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] focus-visible:ring-offset-2">
          View request
        </Link>
      </div>
    </GlassCard>
  )
}

export default BloodRequestCard

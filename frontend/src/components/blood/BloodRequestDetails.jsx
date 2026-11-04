import { Clock3, Droplets, MapPin, Phone, ShieldAlert } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not provided' : date.toLocaleString()
}

function BloodRequestDetails({ request, onReport }) {
  if (!request) return null
  const location = [request.upazila, request.district, request.division].filter(Boolean).join(', ')

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--page-muted)]">Verified request</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--page-text)]">{request.bloodGroup} blood support</h2>
          </div>
          <span className="rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">Verified</span>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Quantity', `${request.quantity} ${request.unit}`],
            ['Hospital or care location', request.hospitalName || 'Not provided'],
            ['Urgency', request.urgency || 'Standard'],
            ['Division', request.division || 'Not provided'],
            ['District', request.district || 'Not provided'],
            ['Upazila', request.upazila || 'Not provided'],
            ['Required by', formatDate(request.requiredAt)],
            ['Listed', formatDate(request.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--page-surface-sunken)] p-3">
              <dt className="text-xs text-[var(--page-muted)]">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--page-text)]">{value}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-[var(--page-text)]">Contact and safety</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--page-muted)]">Only contact the requester if they explicitly consented to share their number. Confirm details directly before making arrangements.</p>
        {request.contactPhone && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--page-text)]">{request.contactPerson || 'Request contact'} · {request.contactPhone}</span>
            <a href={`tel:${request.contactPhone}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] hover:bg-[var(--page-surface-sunken)]"><Phone size={15} aria-hidden="true" />Call</a>
          </div>
        )}
        {location && <p className="mt-4 flex items-center gap-2 text-sm text-[var(--page-muted)]"><MapPin size={15} aria-hidden="true" />{location}</p>}
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--page-muted)]"><Clock3 size={15} aria-hidden="true" />Request review is not donor matching or a guarantee of fulfillment.</p>
        {onReport && (
          <button type="button" onClick={onReport} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] hover:bg-[var(--page-surface-sunken)]">
            <ShieldAlert size={15} aria-hidden="true" /> Report listing
          </button>
        )}
      </GlassCard>
    </div>
  )
}

export default BloodRequestDetails

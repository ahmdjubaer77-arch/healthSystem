import { AlertTriangle } from 'lucide-react'

function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  message,
  action,
  onRetry,
}) {
  const resolvedAction = action || (onRetry && (
    <button
      type="button"
      onClick={onRetry}
      className="min-h-10 rounded-lg border border-[var(--page-border)] px-3 py-2 text-sm font-medium text-[var(--page-text)] hover:bg-[var(--page-surface-sunken)]"
    >
      Try again
    </button>
  ))

  return (
    <div className="rounded-2xl border border-red-700/15 bg-red-50 p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-700">
          <AlertTriangle size={18} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-950">{title}</h3>
          <p className="mt-2 text-sm text-red-900">{message || description}</p>
          {resolvedAction && <div className="mt-4">{resolvedAction}</div>}
        </div>
      </div>
    </div>
  )
}

export default ErrorState

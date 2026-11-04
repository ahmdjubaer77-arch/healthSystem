import { AlertCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reportPublicBloodRequest } from '../../services/api'
import { reportReasons } from '../../data/bloodMockData'

function ReportRequestModal({ isOpen, requestId, accessToken, onClose, onSubmitted }) {
  const [reason, setReason] = useState(reportReasons[0] || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setReason(reportReasons[0] || '')
    setError('')
    setSubmitted(false)
  }, [isOpen, requestId])

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose, saving])

  if (!isOpen) return null

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await reportPublicBloodRequest(accessToken, requestId, reason)
      setSubmitted(true)
      await onSubmitted?.()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your report.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => !saving && event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="report-request-title" className="w-full max-w-lg rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface)] p-5 text-[var(--page-text)] shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--page-muted)]">Community moderation</p>
            <h2 id="report-request-title" className="mt-1 text-xl font-semibold text-[var(--page-text)]">Report blood request</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close report dialog" className="rounded-lg border border-[var(--page-border)] p-2 text-[var(--page-text)] transition-colors hover:bg-[var(--page-surface-raised)]">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" aria-busy={saving}>
          <label className="block text-sm font-medium text-[var(--page-text)]">
            <span className="mb-2 block">Reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="h-11 w-full rounded-lg border border-[var(--page-border)] bg-[var(--page-surface)] px-3 text-sm text-[var(--page-text)] outline-none focus:border-[var(--page-accent)]">
              {reportReasons.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <p className="text-sm leading-6 text-[var(--page-muted)]">Reports are sent to the moderation queue. One report is accepted per signed-in account for each listing.</p>
          {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
          {submitted && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Report sent for review.</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-[var(--page-border)] px-4 py-2.5 text-sm font-medium text-[var(--page-text)] transition-colors hover:bg-[var(--page-surface-raised)] disabled:opacity-60">Close</button>
            {!submitted && <button type="submit" disabled={saving} className="rounded-full bg-[var(--page-accent-strong)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{saving ? 'Submitting…' : 'Submit report'}</button>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportRequestModal

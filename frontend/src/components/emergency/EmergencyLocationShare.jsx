import { useState } from 'react'
import { Share2, ShieldCheck } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function EmergencyLocationShare({ selectedLocation }) {
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const locationText = selectedLocation.approx || [
    selectedLocation.area,
    selectedLocation.upazila,
    selectedLocation.district,
    selectedLocation.division,
  ].filter(Boolean).join(', ')

  const handleShare = async () => {
    setFeedback('')
    setError('')
    if (!locationText) {
      setError('Choose an area or use your device location before sharing.')
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Emergency location', text: locationText })
        setFeedback('Choose the recipient and confirm in your sharing app.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(locationText)
        setFeedback('Location copied. Share it only with someone you trust.')
      } else {
        throw new Error('Location sharing is not available in this browser.')
      }
    } catch (shareError) {
      if (shareError.name === 'AbortError') {
        setFeedback('Location sharing was cancelled.')
      } else {
        setError(shareError.message || 'Unable to share this location.')
      }
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">Location sharing</p>
          <h3 className="mt-2 text-xl font-bold text-white">Share your location</h3>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100" aria-hidden="true">
          <ShieldCheck size={18} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
        Your location stays on this device unless you choose to share it. This platform does not dispatch emergency help.
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={!locationText}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Share2 size={14} aria-hidden="true" />
        Share selected location
      </button>
      {feedback && <p className="mt-3 text-sm text-emerald-200" role="status">{feedback}</p>}
      {error && <p className="mt-3 text-sm text-rose-200" role="alert">{error}</p>}
    </GlassCard>
  )
}

export default EmergencyLocationShare

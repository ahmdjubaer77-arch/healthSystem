import { X } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../common/GlassCard'
import { reportReasons } from '../../data/bloodMockData'

function ReportRequestModal({ isOpen, onClose }) {
  const [reason, setReason] = useState(reportReasons[0])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Report</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Report blood request</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-slate-950/20 p-2 text-slate-200">
            <X size={14} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-300">Reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70">
              {reportReasons.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            Frontend-only reporting placeholder. No moderation backend is connected yet.
          </div>

          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70">
            Report
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

export default ReportRequestModal

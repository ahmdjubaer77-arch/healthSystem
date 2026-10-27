import { FileText, Download, Eye } from 'lucide-react'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function PrescriptionCard({ prescription }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{prescription.doctor}</h3>
            <p className="text-sm text-slate-300">{prescription.clinic}</p>
          </div>
        </div>
        <StatusBadge label={prescription.status} variant={prescription.statusVariant} compact />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Date</p>
          <p className="mt-2 text-sm font-medium text-white">{prescription.date}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">Document type</p>
          <p className="mt-2 text-sm font-medium text-white">{prescription.documentType}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <Eye size={14} />
          View
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70">
          <Download size={14} />
          Download
        </button>
      </div>
    </GlassCard>
  )
}

export default PrescriptionCard

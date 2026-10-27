import { Download, QrCode, Share2 } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function QRHealthProfile({ qrData }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">QR Health Profile</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{qrData.title}</h2>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-100">
          <QrCode size={22} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-slate-950/20 p-6">
          <div className="flex h-44 w-44 items-center justify-center rounded-[28px] border border-cyan-300/30 bg-[radial-gradient(circle,_rgba(34,211,238,0.20),rgba(15,23,42,0.80))] text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
            <QrCode size={72} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Sharing message</p>
            <p className="mt-2 text-sm text-slate-200">{qrData.description}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Selected information</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {qrData.selectedShareData.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
              <Share2 size={14} />
              Generate QR
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70">
              <Download size={14} />
              Share Selected Information
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export default QRHealthProfile

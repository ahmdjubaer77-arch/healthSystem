import { MapPinned } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function HospitalMap({ hospital }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
          <MapPinned size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Map preview</p>
          <h3 className="mt-2 text-xl font-bold text-white">Location preview</h3>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.15),rgba(15,23,42,0.9)_55%,rgba(15,23,42,1)_100%)] p-5">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative grid h-[220px] place-items-center text-sm text-slate-200">
          <div className="absolute left-[20%] top-[28%] rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-cyan-100">
            You
          </div>
          <div className="absolute left-[52%] top-[46%] rounded-full border border-red-300/30 bg-red-500/10 px-3 py-2 text-red-100">
            {hospital.name}
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/25 px-4 py-2 text-sm">OpenStreetMap-ready placeholder</div>
        </div>
      </div>
    </GlassCard>
  )
}

export default HospitalMap

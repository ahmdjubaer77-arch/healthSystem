import { AlertTriangle, Siren } from 'lucide-react'
import GlassCard from '../common/GlassCard'

function EmergencyHero() {
  return (
    <GlassCard className="overflow-hidden border-red-300/20 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),rgba(15,23,42,0.7)_35%,rgba(15,23,42,1)_100%)] p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100">
            <Siren size={12} />
            emergency access
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">🚨 Emergency assistance</h1>
          <p className="mt-2 text-lg font-medium text-red-100">Emergency Assistance</p>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">Quickly find the services you need in an emergency.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-red-100/80">Call</div>
            <div className="mt-2 text-xl font-bold text-white">999</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-red-100/80">Health hotline</div>
            <div className="mt-2 text-xl font-bold text-white">16263</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        <AlertTriangle size={16} />
        If the situation is life-threatening, contact official emergency services immediately.
      </div>
    </GlassCard>
  )
}

export default EmergencyHero

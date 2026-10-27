import { Lock, PencilLine, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

function HealthHeader() {
  return (
    <GlassCard className="overflow-hidden border-cyan-300/20 bg-[linear-gradient(135deg,rgba(14,116,144,0.20),rgba(15,23,42,0.8),rgba(12,74,110,0.2))] p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            <Shield size={12} />
            Private Health Information
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">My health</h1>
          <p className="mt-2 text-xl font-medium text-cyan-100">My Health</p>
          <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
            Keep your health information organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/health/setup" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
            <PencilLine size={14} /> Setup Health
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-200">
          <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 p-2 text-emerald-200">
            <Lock size={16} />
          </div>
          <div>
            <div className="font-semibold text-white">Private access</div>
            <div className="text-xs text-slate-300">Designed with privacy and secure access in mind.</div>
          </div>
        </div>
      </div>
      </div>
    </GlassCard>
  )
}

export default HealthHeader

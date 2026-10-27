import { Droplets, HeartPulse, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

function BloodHero() {
  return (
    <GlassCard className="overflow-hidden border-cyan-300/20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),rgba(15,23,42,0.7)_35%,rgba(15,23,42,1)_100%)] p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100">
            <Droplets size={12} />
            blood support
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">Find a blood donor</h1>
          <p className="mt-2 text-lg font-medium text-red-100">Find Blood</p>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">Find nearby donors by blood group and location.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><Droplets size={15} /> Blood</div>
            Nearby donors
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><HeartPulse size={15} /> Health</div>
            Trustworthy flow
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 text-cyan-100"><MapPin size={15} /> Area</div>
            Approximate location
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/blood" className="inline-flex items-center justify-center rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70">
          Find donors
        </Link>
        <Link to="/blood/request" className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          Create a blood request
        </Link>
      </div>
    </GlassCard>
  )
}

export default BloodHero

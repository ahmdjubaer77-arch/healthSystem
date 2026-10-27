import { ArrowRight, Building2, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import VerificationBadge from '../doctors/VerificationBadge'

function ProviderCard({ provider }) {
  return (
    <GlassCard className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">{provider.providerType}</div>
          <h3 className="mt-2 text-xl font-semibold text-white">{provider.name}</h3>
        </div>
        <VerificationBadge status={provider.verificationStatus} />
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <div className="flex items-center gap-2"><Building2 size={14} className="text-cyan-200" /> {provider.providerType}</div>
        <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-200" /> {provider.upazila}, {provider.division}</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {provider.services.map((service) => (
          <span key={service} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200">{service}</span>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <Link to="/providers" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          View
          <ArrowRight size={14} />
        </Link>
        <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-100">
          <ShieldCheck size={14} />
        </div>
      </div>
    </GlassCard>
  )
}

export default ProviderCard

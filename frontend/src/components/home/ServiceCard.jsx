import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import {
  Ambulance,
  Building2,
  Droplets,
  HeartPulse,
  Pill,
  Stethoscope,
} from 'lucide-react'

const iconMap = {
  heartPulse: HeartPulse,
  pill: Pill,
  hospital: Building2,
  ambulance: Ambulance,
  droplets: Droplets,
  stethoscope: Stethoscope,
}

function ServiceCard({ service }) {
  const Icon = iconMap[service.icon] || HeartPulse

  return (
    <Link to={service.href} className="group block h-full">
      <GlassCard className="flex h-full flex-col justify-between p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <Icon size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-300 transition group-hover:text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">{service.title}</h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">{service.description}</p>
        </div>
      </GlassCard>
    </Link>
  )
}

export default ServiceCard

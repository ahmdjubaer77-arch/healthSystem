import { Ambulance, Building2, Droplets, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../common/GlassCard'

const actions = [
  {
    title: 'Emergency Hospital',
    subtitle: 'Find an emergency hospital',
    to: '/hospitals',
    icon: Building2,
    accent: 'from-red-500/20 to-rose-500/10',
  },
  {
    title: 'Ambulance',
    subtitle: 'Find an ambulance',
    to: '/ambulances',
    icon: Ambulance,
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    title: 'Blood',
    subtitle: 'Find a blood donor',
    to: '/blood',
    icon: Droplets,
    accent: 'from-pink-500/20 to-rose-500/10',
  },
  {
    title: 'Call 999',
    subtitle: 'Official emergency number',
    href: 'tel:999',
    icon: Phone,
    accent: 'from-cyan-500/20 to-sky-500/10',
  },
]

function EmergencyActionGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ title, subtitle, to, href, icon: Icon, accent }) => {
        const content = (
          <GlassCard className={`group h-full overflow-hidden border-red-300/20 bg-gradient-to-br ${accent} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-2.5 text-white">
                <Icon size={20} />
              </div>
              <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.9)]" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">Action</p>
            <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-200">{subtitle}</p>
          </GlassCard>
        )

        if (href) {
          return (
            <a key={title} href={href} aria-label={title} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80">
              {content}
            </a>
          )
        }

        return (
          <Link key={title} to={to} aria-label={title} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/80">
            {content}
          </Link>
        )
      })}
    </div>
  )
}

export default EmergencyActionGrid

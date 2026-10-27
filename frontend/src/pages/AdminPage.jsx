import { Activity, BellRing, CalendarDays, ClipboardList, HeartPulse, MessageSquareWarning, ShieldCheck, UsersRound } from 'lucide-react'
import AdminBreadcrumb from '../components/admin/AdminBreadcrumb'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'

const pageMeta = {
  Dashboard: {
    eyebrow: 'Overview',
    description: 'Monitor platform health, activity, and operational priorities.',
    icon: Activity,
  },
  Users: { eyebrow: 'Accounts', description: 'Manage users, roles, and account status.', icon: UsersRound },
  Providers: { eyebrow: 'Partners', description: 'Review and manage healthcare providers.', icon: ShieldCheck },
  Verifications: { eyebrow: 'Compliance', description: 'Review provider verification and approval workflows.', icon: ShieldCheck },
  Doctors: { eyebrow: 'Care team', description: 'Manage doctor profiles and appointment availability.', icon: HeartPulse },
  Hospitals: { eyebrow: 'Facilities', description: 'Manage hospital listings and contact information.', icon: Activity },
  Pharmacies: { eyebrow: 'Facilities', description: 'Manage pharmacy listings and service availability.', icon: HeartPulse },
  Ambulances: { eyebrow: 'Emergency care', description: 'Manage ambulance services and response details.', icon: Activity },
  'Blood requests': { eyebrow: 'Emergency operations', description: 'Review and coordinate blood donation requests.', icon: Activity },
  'Emergency requests': { eyebrow: 'Emergency operations', description: 'Monitor urgent requests and response activity.', icon: Activity },
  Appointments: { eyebrow: 'Scheduling', description: "Review doctor's appointment requests and status.", icon: CalendarDays },
  Reviews: { eyebrow: 'Feedback', description: 'Review patient feedback and ratings.', icon: ClipboardList },
  Complaints: { eyebrow: 'Support', description: 'Review and manage user complaints.', icon: MessageSquareWarning },
  Analytics: { eyebrow: 'Insights', description: 'Review platform performance and operational trends.', icon: Activity },
  'Audit logs': { eyebrow: 'Security', description: 'Review administrative activity and system events.', icon: ShieldCheck },
  Notifications: { eyebrow: 'Communication', description: 'Manage platform notifications and announcements.', icon: BellRing },
  Settings: { eyebrow: 'Configuration', description: 'Manage platform-wide administration settings.', icon: ShieldCheck },
}

function AdminPage({ page }) {
  const meta = pageMeta[page] || pageMeta.Dashboard
  const Icon = meta.icon

  return (
    <AdminPageContainer>
      <AdminBreadcrumb items={[]} />
      <AdminPageHeader
        eyebrow={meta.eyebrow}
        title={page}
        description={meta.description}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <article
            key={item}
            className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                <Icon size={18} />
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                Live
              </span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-400">Metric {item}</p>
            <p className="mt-1 text-2xl font-bold text-white">{item * 128 + 24}</p>
            <p className="mt-2 text-xs text-slate-500">Updated just now</p>
          </article>
        ))}
      </section>
      <section className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <p className="mt-1 text-xs text-slate-400">Latest operational records</p>
          </div>
          <span className="text-xs text-cyan-200/80">{page}</span>
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-300/30 to-blue-500/20" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">Recent activity record {item}</p>
                <p className="mt-0.5 text-xs text-slate-500">Managed through the admin workspace</p>
              </div>
              <span className="hidden text-xs text-slate-500 sm:block">Today</span>
            </div>
          ))}
        </div>
      </section>
    </AdminPageContainer>
  )
}

export default AdminPage

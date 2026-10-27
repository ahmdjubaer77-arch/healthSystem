import {
  Activity,
  Ambulance,
  Building2,
  CalendarClock,
  Droplets,
  HeartPulse,
  MessageSquareWarning,
  Pill,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminBreadcrumb from '../components/admin/AdminBreadcrumb'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import DashboardSection from '../components/admin/DashboardSection'
import DashboardStatCard from '../components/admin/DashboardStatCard'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import { useAdminPermissions } from '../context/AdminPermissionContext'
import { useAuth } from '../context/AuthContext'
import { getDashboardSummary } from '../services/adminDashboard'

const statCards = [
  { key: 'totalUsers', label: 'Total users', icon: UsersRound, accent: 'cyan', to: '/admin/users' },
  { key: 'activeUsers', label: 'Active users', icon: Activity, accent: 'emerald', to: '/admin/users?status=active' },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope, accent: 'blue', to: '/admin/doctors' },
  { key: 'hospitals', label: 'Hospitals', icon: Building2, accent: 'violet', to: '/admin/hospitals' },
  { key: 'pharmacies', label: 'Pharmacies', icon: Pill, accent: 'amber', to: '/admin/pharmacies' },
  { key: 'ambulances', label: 'Ambulances', icon: Ambulance, accent: 'rose', to: '/admin/ambulances' },
  { key: 'bloodDonors', label: 'Blood donors', icon: Droplets, accent: 'rose', to: '/admin/blood/donors' },
  { key: 'activeBloodRequests', label: 'Active blood requests', icon: Droplets, accent: 'amber', to: '/admin/blood/requests?status=ACTIVE' },
  { key: 'emergencyRequests', label: 'Emergency requests', icon: HeartPulse, accent: 'rose', to: '/admin/emergency' },
  { key: 'pendingVerifications', label: 'Pending verifications', icon: ShieldCheck, accent: 'amber', to: '/admin/verifications?status=PENDING' },
  { key: 'complaints', label: 'Complaints', icon: MessageSquareWarning, accent: 'rose', to: '/admin/complaints' },
]

const verificationCards = [
  { key: 'pending', label: 'Pending', icon: CalendarClock, color: 'amber' },
  { key: 'verified', label: 'Verified', icon: ShieldCheck, color: 'emerald' },
  { key: 'rejected', label: 'Rejected', icon: Activity, color: 'rose' },
]

const quickActions = [
  { label: 'Review verifications', path: '/admin/verifications', permission: 'providers.verify', icon: ShieldCheck },
  { label: 'Review complaints', path: '/admin/complaints', permission: 'complaints.read', icon: MessageSquareWarning },
  { label: 'View analytics', path: '/admin/analytics', permission: 'analytics.read', icon: Activity },
]

function formatDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString()
}

function formatUserName(user) {
  return user?.name || user?.email || 'Unknown provider'
}

function AdminDashboard() {
  const { accessToken } = useAuth()
  const { hasPermission } = useAdminPermissions()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('database')

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getDashboardSummary(accessToken)
    setSummary(result.summary)
    setSource(result.source)
    setLoading(false)
  }, [accessToken])

  useEffect(() => {
    loadSummary().catch((requestError) => {
      setError(requestError)
      setLoading(false)
    })
  }, [loadSummary])

  const verification = useMemo(() => summary?.verification || {}, [summary])
  const recentBloodRequests = summary?.recent?.bloodRequests || []
  const recentEmergencyRequests = summary?.recent?.emergencyRequests || []
  const recentComplaints = summary?.recent?.complaints || []
  const recentProviders = summary?.recent?.providerRegistrations || []
  const visibleQuickActions = quickActions.filter((action) => !action.permission || hasPermission(action.permission))
  const isTemporaryMock = source === 'temporary-mock'

  if (loading) {
    return (
      <AdminPageContainer>
        <AdminBreadcrumb items={[]} />
        <AdminPageHeader eyebrow="Overview" title="Admin dashboard" description="Loading live platform statistics…" />
        <LoadingState message="Loading dashboard summary…" />
      </AdminPageContainer>
    )
  }

  if (error) {
    return (
      <AdminPageContainer>
        <AdminBreadcrumb items={[]} />
        <AdminPageHeader eyebrow="Overview" title="Admin dashboard" description="The dashboard could not load its latest data." />
        <ErrorState
          title="Dashboard unavailable"
          description={error.message}
          action={
            <button type="button" onClick={loadSummary} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
              Retry
            </button>
          }
        />
      </AdminPageContainer>
    )
  }

  const totals = summary?.totals || {}

  return (
    <AdminPageContainer>
      <AdminBreadcrumb items={[]} />
      <AdminPageHeader
        eyebrow="Overview"
        title="Admin dashboard"
        description="Monitor platform activity, providers, requests, and operational health."
        action={{ label: 'Refresh data', icon: false, onClick: loadSummary }}
      />

      {isTemporaryMock && (
        <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Temporary mock data is active because the backend dashboard endpoint is unavailable. No production statistics are being invented.
        </div>
      )}

      <section className="admin-stat-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Platform statistics">
        {statCards.map((stat) => (
          <Link
            key={stat.key}
            to={stat.to}
            className="admin-stat-link block min-w-0 rounded-[20px] outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 [&>article]:transition-colors hover:[&>article]:border-cyan-300/30 hover:[&>article]:bg-white/[0.07]"
          >
            <DashboardStatCard
              label={stat.label}
              value={totals[stat.key]}
              detail={stat.key === 'activeUsers' ? `${totals.totalUsers || 0} total accounts` : undefined}
              icon={stat.icon}
              accent={stat.accent}
            />
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <DashboardSection title="Verification overview" description="Current provider verification activity">
          <div className="grid gap-3 sm:grid-cols-3">
            {verificationCards.map((item) => (
              <div key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{Number(verification[item.key] || 0)}</p>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Quick actions" description="Shortcuts to common administrative workflows">
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleQuickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-4 transition hover:border-cyan-300/25 hover:bg-cyan-400/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
                  <action.icon size={17} />
                </span>
                <span className="text-sm font-medium text-slate-100 group-hover:text-cyan-50">{action.label}</span>
              </Link>
            ))}
          </div>
        </DashboardSection>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <DashboardSection title="Recent blood requests" description="Latest blood request activity">
          {recentBloodRequests.length ? (
            <div className="space-y-3">
              {recentBloodRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{request.name || request.patientName || 'Blood request'}</p>
                    <p className="mt-1 text-xs text-slate-400">{request.bloodGroup || 'Blood group unavailable'} · {formatDate(request.createdAt || request.date)}</p>
                  </div>
                  <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-100">{request.status || 'Pending'}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No blood requests" description="No recent blood requests are available." />}
        </DashboardSection>

        <DashboardSection title="Recent emergency requests" description="Latest emergency service activity">
          {recentEmergencyRequests.length ? (
            <div className="space-y-3">
              {recentEmergencyRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{request.name || request.patientName || 'Emergency request'}</p>
                    <p className="mt-1 text-xs text-slate-400">{request.type || 'Emergency service'} · {formatDate(request.createdAt || request.date)}</p>
                  </div>
                  <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-rose-100">{request.status || 'Open'}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No emergency requests" description="No recent emergency requests are available." />}
        </DashboardSection>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <DashboardSection title="Recent complaints" description="Latest customer complaints">
          {recentComplaints.length ? (
            <div className="space-y-3">
              {recentComplaints.slice(0, 5).map((complaint) => (
                <div key={complaint.id} className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{complaint.title || 'Complaint'}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatUserName(complaint.user)} · {formatDate(complaint.createdAt)}</p>
                    </div>
                    <span className="rounded-full border border-slate-300/20 bg-slate-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-200">{complaint.status || 'Open'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No complaints" description="No recent complaints are available." />}
        </DashboardSection>

        <DashboardSection title="Recent provider registrations" description="Providers added to the platform">
          {recentProviders.length ? (
            <div className="space-y-3">
              {recentProviders.slice(0, 5).map((provider) => (
                <div key={provider.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                    {provider.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{formatUserName(provider)}</p>
                    <p className="mt-1 text-xs text-slate-400">{provider.role} · {formatDate(provider.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${provider.emailVerified ? 'border border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : 'border border-amber-300/20 bg-amber-400/10 text-amber-100'}`}>
                    {provider.emailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No provider registrations" description="No recent provider registrations are available." />}
        </DashboardSection>
      </section>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <RefreshCw size={13} />
        Dashboard data refreshed from the backend when available.
      </div>
    </AdminPageContainer>
  )
}

export default AdminDashboard

import { Activity, Ambulance, Building2, Droplets, HeartPulse, MessageSquareWarning, Pill, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AdminBreadcrumb from '../components/admin/AdminBreadcrumb'
import AdminPageContainer from '../components/admin/AdminPageContainer'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import DashboardSection from '../components/admin/DashboardSection'
import DashboardStatCard from '../components/admin/DashboardStatCard'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import { useAuth } from '../context/AuthContext'
import { getAdminAnalyticsData, RANGE_OPTIONS } from '../services/adminAnalytics'

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0)
}

function MetricCard({ label, value, icon, accent = 'cyan', detail }) {
  return <DashboardStatCard label={label} value={formatNumber(value)} icon={icon} accent={accent} detail={detail} />
}

function AdminAnalytics() {
  const { accessToken } = useAuth()
  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getAdminAnalyticsData(accessToken, 'overview', range))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [accessToken, range])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const users = data?.users || {}
  const providers = data?.providers || {}
  const services = data?.services || {}
  const blood = services.blood || {}
  const emergency = services.emergency || {}
  const complaints = services.complaints || {}
  const rangeLabel = RANGE_OPTIONS.find((option) => option.value === range)?.label || '30 days'

  return (
    <AdminPageContainer>
      <AdminBreadcrumb items={[]} />
      <AdminPageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Aggregated platform metrics. No personal or medical records are returned."
        action={{ label: 'Refresh data', icon: false, onClick: loadAnalytics }}
      />

      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Date range</p><p className="mt-1 text-sm text-slate-400">Time-bound activity uses this period. Current account and provider totals remain current.</p></div>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-white/10 bg-slate-950/30 p-1" role="group" aria-label="Analytics date range">
          {RANGE_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={range === option.value} onClick={() => setRange(option.value)} className={`rounded-md px-3 py-2 text-sm transition ${range === option.value ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}>{option.label}</button>)}
        </div>
      </section>

      {loading && <LoadingState message="Loading analytics..." />}
      {error && <ErrorState title="Analytics unavailable" description={error.message} action={<button type="button" onClick={loadAnalytics} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Retry</button>} />}

      {!loading && !error && <div className="space-y-6">
        <DashboardSection title="Users" description={`Current account totals and new registrations within ${rangeLabel.toLowerCase()}.`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total users" value={users.totalUsers} icon={UsersRound} accent="cyan" />
            <MetricCard label="Active users" value={users.activeUsers} icon={Activity} accent="emerald" />
            <MetricCard label="New users" value={users.newUsersInRange} icon={UsersRound} accent="blue" detail={rangeLabel} />
          </div>
        </DashboardSection>

        <DashboardSection title="Providers" description="Current provider totals from the provider catalogue.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Doctors" value={providers.doctors} icon={Stethoscope} accent="blue" />
            <MetricCard label="Hospitals" value={providers.hospitals} icon={Building2} accent="cyan" />
            <MetricCard label="Pharmacies" value={providers.pharmacies} icon={Pill} accent="amber" />
            <MetricCard label="Ambulances" value={providers.ambulances} icon={Ambulance} accent="rose" />
          </div>
        </DashboardSection>

        <DashboardSection title="Blood" description={`Requests created during ${rangeLabel.toLowerCase()}; donor total is current.`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Blood donors" value={blood.bloodDonors} icon={UsersRound} accent="rose" />
            <MetricCard label="Blood requests" value={blood.bloodRequests} icon={Droplets} accent="cyan" />
            <MetricCard label="Active requests" value={blood.activeRequests} icon={Activity} accent="amber" />
            <MetricCard label="Fulfilled requests" value={blood.fulfilledRequests} icon={ShieldCheck} accent="emerald" />
          </div>
        </DashboardSection>

        <DashboardSection title="Emergency" description={`Emergency request records created during ${rangeLabel.toLowerCase()}, grouped by current status.`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total requests" value={emergency.totalRequests} icon={HeartPulse} accent="rose" />
            <MetricCard label="Active requests" value={emergency.activeRequests} icon={Activity} accent="amber" />
            <MetricCard label="Resolved requests" value={emergency.resolvedRequests} icon={ShieldCheck} accent="emerald" />
          </div>
        </DashboardSection>

        <DashboardSection title="Complaints" description={`Complaint records created during ${rangeLabel.toLowerCase()}.`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total complaints" value={complaints.total} icon={MessageSquareWarning} accent="rose" />
            <MetricCard label="Open complaints" value={complaints.open} icon={Activity} accent="amber" />
            <MetricCard label="Resolved complaints" value={complaints.resolved} icon={ShieldCheck} accent="emerald" />
          </div>
        </DashboardSection>
      </div>}
    </AdminPageContainer>
  )
}

export default AdminAnalytics
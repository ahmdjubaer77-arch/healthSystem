import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BloodRequestCard from '../components/blood/BloodRequestCard'
import BloodRequestForm from '../components/blood/BloodRequestForm'
import BloodSafetyNotice from '../components/blood/BloodSafetyNotice'
import SectionHeader from '../components/common/SectionHeader'
import GlassCard from '../components/common/GlassCard'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { getMyBloodRequests, getPublicBloodRequests } from '../services/api'

const PAGE_SIZE = 20

function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not provided' : date.toLocaleString()
}

function BloodRequest() {
  const { accessToken, user } = useAuth()
  const [requests, setRequests] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)
  const [error, setError] = useState('')
  const [myRequestsError, setMyRequestsError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [myReloadKey, setMyReloadKey] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getPublicBloodRequests({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!Array.isArray(result?.requests) || !result?.pagination) {
          throw new Error('The blood request service returned invalid listing data.')
        }
        if (!active) return
        setRequests(result.requests)
        setPagination(result.pagination)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, reloadKey])

  useEffect(() => {
    if (!accessToken) {
      setMyRequests([])
      setMyRequestsError('')
      return undefined
    }

    let active = true
    setMyRequestsLoading(true)
    setMyRequestsError('')
    getMyBloodRequests(accessToken)
      .then((result) => {
        if (!Array.isArray(result?.requests)) throw new Error('The request service returned invalid tracking data.')
        if (active) setMyRequests(result.requests)
      })
      .catch((requestError) => { if (active) setMyRequestsError(requestError.message) })
      .finally(() => { if (active) setMyRequestsLoading(false) })
    return () => { active = false }
  }, [accessToken, myReloadKey])

  const refreshAfterSubmit = () => {
    setMyReloadKey((key) => key + 1)
    setReloadKey((key) => key + 1)
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Community support"
        title="Blood requests"
        subtitle="Submit a request for administrator review, track your own requests, or browse verified public listings."
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {accessToken ? (
          <BloodRequestForm accessToken={accessToken} user={user} onCreated={refreshAfterSubmit} />
        ) : (
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold text-[var(--page-text)]">Submit a blood request</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--page-muted)]">Sign in with a patient account to submit a request. Contact details remain private unless you explicitly choose to share them.</p>
            <Link to="/login?redirect=%2Fblood%2Frequest" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[var(--page-text)] px-4 py-2 text-sm font-semibold text-white">Sign in to continue</Link>
          </GlassCard>
        )}
        <BloodSafetyNotice />
      </div>

      {accessToken && (
        <section className="space-y-3" aria-labelledby="my-blood-requests-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="my-blood-requests-title" className="text-xl font-semibold text-[var(--page-text)]">My requests</h2>
            <span className="text-sm text-[var(--page-muted)]">{myRequests.length} total</span>
          </div>
          {myRequestsError && <ErrorState message={myRequestsError} onRetry={() => setMyReloadKey((key) => key + 1)} />}
          {myRequestsLoading && <LoadingState label="Loading your requests" />}
          {!myRequestsLoading && !myRequestsError && myRequests.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--page-border)] p-5 text-sm text-[var(--page-muted)]">You have not submitted any blood requests.</p>
          )}
          {!myRequestsLoading && !myRequestsError && myRequests.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {myRequests.map((request) => (
                <GlassCard key={request.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-[var(--page-text)]">{request.bloodGroup} · {request.quantity} {request.unit}</p>
                    <p className="mt-1 text-sm text-[var(--page-muted)]">{request.hospitalName || 'Hospital not specified'}</p>
                    <p className="mt-1 text-xs text-[var(--page-muted)]">{request.urgency || 'STANDARD'} urgency · Required by {formatDate(request.requiredAt)}</p>
                    {request.verificationReason && <p className="mt-2 max-w-sm text-xs leading-5 text-rose-600 dark:text-rose-300">Review update: {request.verificationReason}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--page-text)]">{request.verificationStatus}</p>
                    <p className="mt-1 text-xs text-[var(--page-muted)]">{request.status}</p>
                    {request.status === 'ACTIVE' && <Link to={`/blood/requests/${request.id}`} className="mt-2 inline-flex text-sm font-medium text-[var(--page-accent)] underline underline-offset-2">View public listing</Link>}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4" aria-labelledby="public-blood-requests-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--page-muted)]">Verified public listings</p>
            <h2 id="public-blood-requests-title" className="mt-1 text-xl font-semibold text-[var(--page-text)]">Nearby blood requests</h2>
          </div>
          <span className="rounded-full border border-[var(--page-border)] px-3 py-1.5 text-sm text-[var(--page-muted)]">{pagination.total} listed</span>
        </div>

        {error && <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
        {loading && <LoadingState label="Loading verified blood requests" />}
        {!loading && !error && requests.length === 0 && <EmptyState title="No verified requests are listed" description="Check back later or submit a request for administrator review." />}
        {!loading && !error && requests.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {requests.map((request) => <BloodRequestCard key={request.id} request={request} />)}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--page-muted)]">
              <span>Page {pagination.page} of {Math.max(pagination.pages, 1)}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-lg border border-[var(--page-border)] px-3 disabled:opacity-40">Previous</button>
                <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-[var(--page-border)] px-3 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default BloodRequest

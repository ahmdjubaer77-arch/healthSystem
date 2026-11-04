import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BloodRequestDetailsComponent from '../components/blood/BloodRequestDetails'
import ReportRequestModal from '../components/blood/ReportRequestModal'
import SectionHeader from '../components/common/SectionHeader'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { useAuth } from '../context/AuthContext'
import { getPublicBloodRequest } from '../services/api'

function BloodRequestDetailsPage() {
  const { id } = useParams()
  const { accessToken } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getPublicBloodRequest(id)
      .then((result) => { if (active) setRequest(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, reloadKey])

  if (loading) return <LoadingState label="Loading verified blood request" className="mt-6" />
  if (error) return (
    <div className="space-y-5 py-4">
      <ErrorState title="Blood request unavailable" message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      <Link to="/blood/request" className="inline-flex min-h-10 items-center rounded-lg border border-[var(--page-border)] px-4 py-2 text-sm font-medium text-[var(--page-text)]">Back to blood requests</Link>
    </div>
  )
  if (!request) {
    return (
      <div className="space-y-5 py-4">
        <SectionHeader kicker="Request details" title="Blood request not found" subtitle="This request is not available in the verified public directory." />
        <Link to="/blood/request" className="inline-flex min-h-10 items-center rounded-lg border border-[var(--page-border)] px-4 py-2 text-sm font-medium text-[var(--page-text)]">Back to blood requests</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Verified public listing"
        title={`${request.bloodGroup} blood request`}
        subtitle={[request.hospitalName, request.division, request.district, request.upazila].filter(Boolean).join(' · ')}
      />
      <BloodRequestDetailsComponent request={request} onReport={accessToken ? () => setIsReportOpen(true) : null} />
      <ReportRequestModal
        requestId={request.id}
        accessToken={accessToken}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmitted={() => setReloadKey((key) => key + 1)}
      />
    </div>
  )
}

export default BloodRequestDetailsPage

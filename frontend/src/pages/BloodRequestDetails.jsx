import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BloodRequestDetailsComponent from '../components/blood/BloodRequestDetails'
import ReportRequestModal from '../components/blood/ReportRequestModal'
import SectionHeader from '../components/common/SectionHeader'
import { bloodRequests } from '../data/bloodMockData'

function BloodRequestDetailsPage() {
  const { id } = useParams()
  const request = useMemo(
    () => bloodRequests.find((entry) => entry.id === id || entry.id === Number(id)),
    [id],
  )
  const [isReportOpen, setIsReportOpen] = useState(false)

  if (!request) {
    return (
      <div className="space-y-6 py-4">
        <SectionHeader
          kicker="Request details"
          title="Blood request not found"
          subtitle="This demo request is not available in the mock dataset."
        />
        <Link to="/blood/request" className="inline-flex items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          Back to blood requests
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Request details"
        title={`${request.bloodGroup} blood support request`}
        subtitle={`${request.hospital} • ${request.division} • ${request.district} • ${request.upazila}`}
      />

      <BloodRequestDetailsComponent request={request} onReport={() => setIsReportOpen(true)} />
      <ReportRequestModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  )
}

export default BloodRequestDetailsPage

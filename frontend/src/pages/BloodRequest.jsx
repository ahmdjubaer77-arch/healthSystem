import { useState } from 'react'
import BloodRequestCard from '../components/blood/BloodRequestCard'
import BloodRequestForm from '../components/blood/BloodRequestForm'
import BloodSafetyNotice from '../components/blood/BloodSafetyNotice'
import RequestVerification from '../components/blood/RequestVerification'
import SectionHeader from '../components/common/SectionHeader'
import { bloodRequests } from '../data/bloodMockData'

function BloodRequest() {
  const [selectedStatus] = useState('Pending Verification')

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Request support"
        title="Blood request"
        subtitle="Create a request, track verification, and review active support needs in your area."
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <BloodRequestForm />
        <div className="space-y-4">
          <RequestVerification status={selectedStatus} />
          <BloodSafetyNotice />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Recent requests</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Nearby blood requests</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/20 px-3 py-1.5 text-sm text-slate-200">{bloodRequests.length} live</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bloodRequests.map((request) => (
            <BloodRequestCard key={request.id} request={request} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BloodRequest

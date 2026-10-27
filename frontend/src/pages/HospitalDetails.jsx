import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HospitalDetailsComponent from '../components/hospitals/HospitalDetails'
import SectionHeader from '../components/common/SectionHeader'
import GlassCard from '../components/common/GlassCard'
import { getPublicHospitalById } from '../services/api'

function HospitalDetails() {
  const { id } = useParams()
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getPublicHospitalById(id)
      .then((result) => { if (active) setHospital(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <GlassCard className="p-8 text-center text-slate-300">Loading hospital details...</GlassCard>

  if (error || !hospital) {
    return (
      <div className="space-y-6 py-4">
        <SectionHeader
          kicker="Hospital details"
          title="Hospital not found"
          subtitle={error || 'This hospital is not publicly available. Please return to the hospital finder.'}
        />
        <Link to="/hospitals" className="inline-flex items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          Return to Hospitals
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Hospital details"
        title={hospital.name}
        subtitle={[hospital.division, hospital.district, hospital.upazila].filter(Boolean).join(' • ')}
      />
      <HospitalDetailsComponent hospital={hospital} />
    </div>
  )
}

export default HospitalDetails

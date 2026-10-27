import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConsultationInfo from '../components/doctors/ConsultationInfo'
import DoctorHospitalAffiliation from '../components/doctors/DoctorHospitalAffiliation'
import DoctorProfessionalInfo from '../components/doctors/DoctorProfessionalInfo'
import DoctorProfileHeader from '../components/doctors/DoctorProfileHeader'
import DoctorSafetyNotice from '../components/doctors/DoctorSafetyNotice'
import SectionHeader from '../components/common/SectionHeader'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getDoctorById } from '../services/api'

function DoctorDetails() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getDoctorById(id)
      .then((result) => { if (active) setDoctor(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, reloadKey])

  if (loading) return <LoadingState label="Loading doctor profile" className="mt-6" />
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} />
  if (!doctor) {
    return <div className="space-y-6 py-4"><SectionHeader kicker="Doctor profile" title="Doctor not found" subtitle="This doctor is not currently available in the verified directory." /><Link to="/doctors" className="inline-flex items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">Back to doctors</Link></div>
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader kicker="Doctor profile" title={doctor.name} subtitle={`${doctor.specialty} · ${doctor.hospitalName} · ${doctor.division}`} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <DoctorProfileHeader doctor={doctor} />
          <DoctorProfessionalInfo doctor={doctor} />
          <DoctorHospitalAffiliation doctor={doctor} />
          <ConsultationInfo doctor={doctor} />
        </div>
        <div className="space-y-4"><DoctorSafetyNotice /></div>
      </div>
    </div>
  )
}

export default DoctorDetails

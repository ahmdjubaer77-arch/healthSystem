import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone } from 'lucide-react'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import { getDoctorById } from '../services/api'

function DoctorAppointment() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDoctorById(id)
      .then((result) => { if (active) setDoctor(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <LoadingState label="Loading doctor contact information" className="mt-6" />
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(''); getDoctorById(id).then(setDoctor).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)) }} />
  if (!doctor) return <div className="space-y-6 py-4"><SectionHeader kicker="Doctor contact" title="Doctor not found" subtitle="This doctor is not currently available in the verified directory." /><Link to="/doctors" className="text-cyan-100">Back to doctors</Link></div>

  return (
    <div className="space-y-6 py-4">
      <SectionHeader kicker="Doctor contact" title={doctor.name} subtitle={`${doctor.specialty} · ${doctor.hospitalName}`} />
      <GlassCard className="p-5 sm:p-7">
        <p className="text-sm text-slate-200">There is no online appointment scheduling service. Contact the clinic directly to arrange a visit.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {doctor.contactPhone && <a href={`tel:${doctor.contactPhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100"><Phone size={16} />Call clinic</a>}
          <Link to={`/doctors/${doctor.id}`} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">View profile</Link>
        </div>
      </GlassCard>
    </div>
  )
}

export default DoctorAppointment

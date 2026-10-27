import { useState } from 'react'
import EmergencyActionGrid from '../components/emergency/EmergencyActionGrid'
import EmergencyHero from '../components/emergency/EmergencyHero'
import EmergencyLocationShare from '../components/emergency/EmergencyLocationShare'
import EmergencyNotice from '../components/emergency/EmergencyNotice'
import EmergencyRequest from '../components/emergency/EmergencyRequest'
import LocationSelector from '../components/emergency/LocationSelector'
import GlassCard from '../components/common/GlassCard'

function Emergency() {
  const [selectedLocation, setSelectedLocation] = useState({
    division: '',
    district: '',
    upazila: '',
    area: '',
    approx: '',
  })

  return (
    <div className="space-y-6 py-4">
      <EmergencyHero />
      <EmergencyActionGrid />

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <LocationSelector
          selectedLocation={selectedLocation}
          onChange={setSelectedLocation}
        />
        <EmergencyLocationShare selectedLocation={selectedLocation} />
      </div>

      <EmergencyNotice />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">☎️</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Official service</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Health Batayon — 16263</h3>
            </div>
          </div>

          <p className="text-sm text-slate-200">This UI provides direct access to the official service. It does not replace emergency professionals or dispatch systems.</p>

          <a
            href="tel:16263"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            📞 Call Health Batayon
          </a>
        </GlassCard>

        <EmergencyRequest />
      </div>
    </div>
  )
}

export default Emergency

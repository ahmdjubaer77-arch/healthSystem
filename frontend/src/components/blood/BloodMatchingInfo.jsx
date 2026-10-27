import { HeartPulse, MapPin, ShieldCheck, TimerReset } from 'lucide-react'
import GlassCard from '../common/GlassCard'

const rules = [
  { icon: HeartPulse, title: 'Blood group compatibility', text: 'Compatibility is guided by general blood group understanding, but final decisions must follow the guidance of a qualified clinician or blood centre.' },
  { icon: MapPin, title: 'Geographic proximity', text: 'Nearby donors may be easier to contact quickly, but location is approximate only.' },
  { icon: TimerReset, title: 'Availability', text: 'Availability is provided by the donor and may change; confirm it directly before making plans.' },
  { icon: ShieldCheck, title: 'Verification status', text: 'Verification confirms the donor profile was reviewed; it is not a medical screening decision.' },
]

function BloodMatchingInfo() {
  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Matching information</p>
        <h2 className="mt-2 text-2xl font-bold text-white">রক্তদাতা মিল খোঁজার বিষয়গুলো</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[24px] border border-white/10 bg-slate-950/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-100"><Icon size={16} /> <span className="font-semibold text-white">{title}</span></div>
            <p className="text-sm text-slate-200">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        রক্তদান বা transfusion-এর উপযুক্ততা সম্পর্কে চূড়ান্ত সিদ্ধান্ত যোগ্য চিকিৎসক/রক্তকেন্দ্রের নির্দেশনা অনুযায়ী হওয়া উচিত।
      </div>
    </GlassCard>
  )
}

export default BloodMatchingInfo

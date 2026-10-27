import {
  Activity,
  BriefcaseMedical,
  Eye,
  HeartPulse,
  Microscope,
  Pill,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react'


const iconMap = {
  Cardiology: HeartPulse,
  Neurology: BrainIcon,
  Dermatology: ShieldCheck,
  Pediatrics: Syringe,
  'Gynecology & Obstetrics': UserRound,
  Orthopedics: Stethoscope,
  ENT: Microscope,
  Ophthalmology: Eye,
  Psychiatry: BriefcaseMedical,
  Dentistry: Pill,
  'General Surgery': Activity,
}

function BrainIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}><path d="M9 4.5a3 3 0 0 1 6 0v.5a2.5 2.5 0 0 1 2.5 2.5V8a3 3 0 0 1-3 3h-.5V8h.5a1 1 0 0 0 1-1v-.5a1.5 1.5 0 0 0-3 0V8h-1V6.5A1.5 1.5 0 0 0 9 5v-.5a1.5 1.5 0 0 1 3 0v.5H9Zm-3 5.5h3v2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h.5v4Zm12 0h-3v2h3a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5v4ZM8 14v2.5A2.5 2.5 0 0 0 10.5 19H13a2 2 0 0 0 2-2v-3H8Zm0 0h8"/><path d="M9 12h6"/></svg>
}

function SpecialtyCategories({ specialties, active, onSelect }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {specialties.filter((item) => item !== 'All' && item !== 'Medicine').map((specialty) => {
        const Icon = iconMap[specialty] || Stethoscope
        const isActive = active === specialty

        return (
          <button
            key={specialty}
            type="button"
            onClick={() => onSelect(specialty)}
            className={`rounded-[24px] border p-4 text-left transition ${
              isActive
                ? 'border-cyan-300/40 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                : 'border-white/10 bg-slate-950/20 text-slate-100 hover:bg-white/5'
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/30 text-cyan-100">
              <Icon size={16} />
            </div>
            <div className="text-base font-semibold">{specialty}</div>
          </button>
        )
      })}
    </div>
  )
}

export default SpecialtyCategories

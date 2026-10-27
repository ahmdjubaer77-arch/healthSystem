import { CalendarDays, Edit3, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../common/GlassCard'
import StatusBadge from '../common/StatusBadge'

function HealthOverview({ profile }) {
  const navigate = useNavigate()

  return (
    <section id="overview" className="scroll-mt-24">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Profile overview</p>
              <h2 className="mt-3 text-2xl font-bold text-white">{profile.fullName}</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile?editProfile=1')}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <Edit3 size={14} />
              Edit Profile
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
                <CalendarDays size={14} className="text-cyan-200" />
                Date of birth
              </div>
              <p className="mt-2 text-base font-semibold text-white">{profile.dateOfBirth}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">Age</p>
              <p className="text-sm font-medium text-cyan-100">{profile.age}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
                <UserRound size={14} className="text-cyan-200" />
                Gender
              </div>
              <p className="mt-2 text-base font-semibold text-white">{profile.gender}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-300">District</div>
              <p className="mt-2 text-base font-semibold text-white">{profile.district}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Area</div>
              <p className="mt-2 text-base font-semibold text-white">{profile.area}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Blood group</div>
              <p className="mt-2 text-base font-semibold text-white">{profile.bloodGroup}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Mobile number</div>
              <p className="mt-2 text-base font-semibold text-white">{profile.mobileNumber}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Emergency contact</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{profile.emergencyContact}</h3>
          <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">Private note</p>
            <p className="mt-2 text-sm text-slate-100">{profile.privacyNote}</p>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/20 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Care location</p>
              <p className="mt-2 text-sm font-medium text-white">{profile.placeOfCare}</p>
            </div>
            <StatusBadge label="Private" variant="info" compact />
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

export default HealthOverview

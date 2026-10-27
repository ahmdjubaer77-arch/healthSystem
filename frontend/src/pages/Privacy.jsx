import { Activity, Lock, ShieldCheck, Users } from 'lucide-react'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'

const demoAccessHistory = [
  'Doctor profile viewed health summary',
  'Health record accessed for checkup overview',
  'Emergency profile shared with care team',
  'Health summary exported in demo workspace',
]

function Privacy() {
  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Privacy center"
        title="Health data & privacy"
        subtitle="Sensitive health information must be treated carefully. This page is a frontend-only privacy dashboard for future backend controls."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Health data</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Sensitive information</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              Your health information is sensitive and should only be accessed or shared when necessary. This frontend demonstrates privacy-first information design without implying any real security system is active.
            </p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Sharing</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Future sharing controls</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {['Health Record Sharing', 'QR Health Profile', 'Doctor Access', 'Emergency Access'].map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <span>{item}</span>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
                  >
                    Placeholder
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Access history</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Demo access history</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {demoAccessHistory.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Security</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Control notices</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-200">
              Current security settings are UI placeholders. Full access control, session tracking, and data protection features will be added after backend authentication is available.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default Privacy

import { BellRing, BellOff, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'

const defaultNotifications = [
  { key: 'healthReminders', label: 'Health Reminders', enabled: true },
  { key: 'appointmentUpdates', label: 'Appointment Updates', enabled: true },
  { key: 'bloodRequestUpdates', label: 'Blood Request Updates', enabled: true },
  { key: 'emergencyAlerts', label: 'Emergency Alerts', enabled: true },
  { key: 'securityNotifications', label: 'Security Notifications', enabled: false },
]

function Notifications() {
  const [notifications, setNotifications] = useState(defaultNotifications)

  const toggle = (key) => {
    setNotifications((current) =>
      current.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Preferences"
        title="Notification settings"
        subtitle="Demo notification controls for the healthcare frontend. These toggles do not trigger real messages or subscriptions."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
              <BellRing size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Alert preferences</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Channel settings</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/5 p-2 text-slate-200">
                    {item.enabled ? <BellRing size={14} /> : <BellOff size={14} />}
                  </span>
                  <span className="text-sm text-slate-200">{item.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`inline-flex h-7 w-12 items-center rounded-full border transition ${
                    item.enabled ? 'border-cyan-300/35 bg-cyan-400/20' : 'border-white/10 bg-slate-900/40'
                  }`}
                  aria-label={item.label}
                >
                  <span className={`h-5 w-5 rounded-full bg-white transition ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-2 text-amber-100">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Safety notice</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Demo only</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-200">
            <p>• This notification setup is a frontend prototype.</p>
            <p>• No real notifications, SMS, or push messages are sent.</p>
            <p>• Emergency alerts are UI placeholders for future backend integration.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

export default Notifications

import { BellRing, Eye, Lock, Smartphone } from 'lucide-react'
import { useState } from 'react'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import { useLanguage } from '../context/LanguageContext'

function Settings() {
  const { t } = useLanguage()
  const [preferences, setPreferences] = useState({
    darkMode: true,
    compactView: false,
    biometrics: false,
    smsAlerts: true,
    pushAlerts: true,
    accessibilityMode: false,
  })

  const toggle = (key) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
  }

  const settingRows = [
    { label: t('appearance'), value: preferences.darkMode ? t('darkGlass') : t('lightTheme'), icon: Smartphone },
    { label: t('accessibility'), value: preferences.accessibilityMode ? t('highContrastOn') : t('standardMode'), icon: Eye },
  ]

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker={t('accountSettings')}
        title={t('settingsTitle')}
        subtitle={t('settingsSubtitle')}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white">{t('quickOverview')}</h3>
          <div className="mt-4 space-y-3">
            {settingRows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                <div className="flex items-center gap-3 text-slate-200">
                  <span className="rounded-full bg-cyan-500/10 p-2 text-cyan-100">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-xs text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <BellRing size={18} className="text-cyan-200" />
              <h3 className="text-xl font-semibold text-white">{t('notificationPreferences')}</h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                [t('emergencyAlerts'), 'smsAlerts'],
                [t('medicationReminders'), 'pushAlerts'],
                [t('securityUpdates'), 'biometrics'],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <span className="text-sm text-slate-200">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={`inline-flex h-7 w-12 items-center rounded-full border transition ${
                      preferences[key] ? 'border-cyan-300/35 bg-cyan-400/20' : 'border-white/10 bg-slate-900/40'
                    }`}
                    aria-label={label}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-cyan-200" />
              <h3 className="text-xl font-semibold text-white">{t('securityAccessibility')}</h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                [t('twoFactor'), 'biometrics'],
                [t('accessibilityMode'), 'accessibilityMode'],
                [t('privateProfile'), 'compactView'],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <span className="text-sm text-slate-200">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={`inline-flex h-7 w-12 items-center rounded-full border transition ${
                      preferences[key] ? 'border-cyan-300/35 bg-cyan-400/20' : 'border-white/10 bg-slate-900/40'
                    }`}
                    aria-label={label}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">{t('availableAfterAuth')}</p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default Settings

import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import { useToast } from '../context/ToastContext'

function ForgotPassword() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [step, setStep] = useState(1)
  const [contact, setContact] = useState('demo@example.com')
  const [newPassword, setNewPassword] = useState('')

  const handleRequestDemo = (event) => {
    event.preventDefault()
    setStep(2)
    addToast({
      type: 'info',
      title: 'Demo recovery started',
      message: 'A verification flow has been simulated on the frontend. No real OTP or email is sent.',
    })
  }

  const handleReset = (event) => {
    event.preventDefault()
    if (!newPassword.trim() || newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Reset not completed',
        message: 'Choose a password that is at least 8 characters long.',
      })
      return
    }

    addToast({
      type: 'success',
      title: 'Demo password reset',
      message: 'Your password was reset in the prototype only. No real security action occurred.',
    })
    setStep(3)
    window.setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <div className="py-8">
      <SectionHeader
        kicker="Account recovery"
        title="Forgot password"
        subtitle="Demo password recovery flow only. This interface does not send real verification messages or OTPs."
      />

      <div className="mx-auto max-w-2xl">
        <GlassCard className="p-5 sm:p-6">
          {step === 1 && (
            <form onSubmit={handleRequestDemo} className="space-y-5">
              <div>
                <label htmlFor="contact" className="mb-2 block text-sm font-medium text-slate-200">
                  Email or phone number
                </label>
                <input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your email or phone"
                />
              </div>

              <div className="rounded-[22px] border border-amber-300/20 bg-amber-500/8 p-4 text-sm text-amber-100">
                Demo password recovery flow. No real verification code or email is sent.
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-3 font-semibold text-cyan-100"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-500/8 p-4 text-sm text-cyan-100">
                Verification demo accepted for <span className="font-semibold">{contact}</span>.
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-200">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your new password"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-3 font-semibold text-cyan-100"
              >
                <ShieldCheck size={16} />
                Reset Password
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-emerald-300">
                <CheckCircle2 size={42} />
              </div>
              <h3 className="text-2xl font-bold text-white">Recovery complete</h3>
              <p className="text-sm text-slate-300">
                This is a frontend prototype only. No real recovery email or OTP was actually sent.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100"
              >
                Return to login
              </Link>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default ForgotPassword

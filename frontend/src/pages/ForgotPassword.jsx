import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OtpInput from '../components/auth/OtpInput'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from '../services/api'

const RESEND_SECONDS = 60

function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [otpExpiresAt, setOtpExpiresAt] = useState(null)
  const [isOtpExpired, setIsOtpExpired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => setCountdown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const handleRequestCode = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      const result = await requestPasswordReset(email)
      setSuccess(result.message)
      setStep(2)
      setCountdown(RESEND_SECONDS)
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setIsOtpExpired(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to request a reset code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await verifyPasswordResetCode(email, code)
      setResetToken(result.data.resetToken)
      setStep(3)
    } catch (verifyError) {
      setError(verifyError.message || 'That code could not be verified.')
      if (verifyError.code === 'OTP_EXPIRED') setIsOtpExpired(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isLoading) return
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      const result = await requestPasswordReset(email)
      setSuccess(result.message)
      setCode('')
      setCountdown(RESEND_SECONDS)
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setIsOtpExpired(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to request a new code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword({ email, resetToken, password, confirmPassword })
      setStep(4)
    } catch (resetError) {
      setError(resetError.message || 'Unable to reset your password.')
      if (resetError.code === 'RESET_AUTH_INVALID') {
        setResetToken('')
        setStep(2)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-8">
      <SectionHeader
        kicker="Secure account recovery"
        title="Reset your password"
        subtitle="We’ll send a short-lived verification code to your registered email."
      />
      <div className="mx-auto max-w-xl">
        <GlassCard className="overflow-hidden border border-white/10 bg-slate-950/45 p-5 shadow-[0_28px_90px_rgba(2,8,23,.42)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200">
              {step === 1 ? <Mail size={20} /> : step === 3 ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200/80">Account recovery</p>
              <h2 className="text-lg font-semibold text-white">
                {step === 1 ? 'Find your account' : step === 2 ? 'Verify it’s you' : step === 3 ? 'Choose a new password' : 'Password updated'}
              </h2>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <p className="text-sm leading-6 text-slate-300">Enter the email address linked to your Nirogix X account. If an account exists, we’ll send a 6-digit code.</p>
              <label className="block text-sm font-medium text-slate-200" htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
              />
              <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-60">
                {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                Send verification code
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <p className="text-sm leading-6 text-slate-300">Enter the 6-digit code sent to <strong className="text-cyan-100">{email}</strong>. The code expires in 5 minutes.</p>
              <OtpInput
                value={code}
                onChange={(value) => { setCode(value); setError('') }}
                disabled={isLoading}
                error={error}
                expiresAt={otpExpiresAt}
                onExpired={() => setIsOtpExpired(true)}
              />
              <button disabled={isLoading || isOtpExpired || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-60">
                {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                {isLoading ? 'Verifying code...' : 'Verify code'}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" disabled={countdown > 0 || isLoading} onClick={handleResend} className="font-medium text-cyan-200 hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500">
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
                <button type="button" onClick={() => { setStep(1); setError(''); setCode('') }} className="text-slate-400 hover:text-white">Change email</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="mb-5 text-sm leading-6 text-slate-300">Create a new password for <strong className="text-cyan-100">{email}</strong>.</p>
              <label className="block text-sm font-medium text-slate-200" htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10" placeholder="At least 8 characters" />
              <label className="block pt-1 text-sm font-medium text-slate-200" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10" placeholder="Enter your password again" />
              <button disabled={isLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-60">
                {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <KeyRound size={17} />}
                Update password
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-300" />
              <p className="text-lg font-semibold text-white">Your password has been reset</p>
              <p className="text-sm text-slate-300">You can now sign in with your new password.</p>
              <button type="button" onClick={() => navigate('/login', { replace: true })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950">
                Return to login <ArrowRight size={17} />
              </button>
            </div>
          )}

          {error && step !== 2 && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100" role="alert">{error}</p>}
          {success && step === 2 && <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2.5 text-sm text-cyan-100" role="status">{success}</p>}
          {step !== 4 && (
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-100">
              <ArrowLeft size={15} /> Back to login
            </Link>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default ForgotPassword

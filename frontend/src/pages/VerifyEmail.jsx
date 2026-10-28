import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import OtpInput from '../components/auth/OtpInput'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import { requestEmailVerification, verifyEmailCode } from '../services/api'

const RESEND_SECONDS = 60

function VerifyEmail() {
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [step, setStep] = useState(location.state?.email ? 'code' : 'email')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(location.state?.email && !location.state?.requestCode ? RESEND_SECONDS : 0)
  const [otpExpiresAt, setOtpExpiresAt] = useState(
    location.state?.email && !location.state?.requestCode ? Date.now() + 5 * 60 * 1000 : null,
  )
  const [isOtpExpired, setIsOtpExpired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [deliveryPending, setDeliveryPending] = useState(Boolean(location.state?.deliveryPending))

  useEffect(() => {
    if (!location.state?.requestCode || !email) return undefined

    let active = true
    setIsLoading(true)
    requestEmailVerification(email)
      .then(() => {
        if (active) {
          setCountdown(RESEND_SECONDS)
          setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
          setIsOtpExpired(false)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to send a verification code.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [email, location.state?.requestCode])

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => setCountdown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await requestEmailVerification(email)
      setStep('code')
      setCode('')
      setCountdown(RESEND_SECONDS)
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setIsOtpExpired(false)
      setDeliveryPending(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to send a verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await verifyEmailCode(email, code)
      setIsVerified(true)
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
    setIsLoading(true)
    try {
      await requestEmailVerification(email)
      setCode('')
      setCountdown(RESEND_SECONDS)
      setDeliveryPending(false)
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000)
      setIsOtpExpired(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to send a new verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-8">
      <SectionHeader
        kicker="Email verification"
        title={isVerified ? 'Email verified' : 'Verify your email'}
        subtitle="Keep your Nirogix X account secure with a verified email address."
      />
      <div className="mx-auto max-w-xl">
        <GlassCard className="overflow-hidden border border-white/10 bg-slate-950/45 p-5 shadow-[0_28px_90px_rgba(2,8,23,.42)] backdrop-blur-2xl sm:p-8">
          {isVerified ? (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 size={50} className="mx-auto text-emerald-300" />
              <h2 className="text-xl font-semibold text-white">Your email is verified</h2>
              <p className="text-sm text-slate-300">Your account is ready. Sign in to continue.</p>
              <Link to="/login" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950">
                Go to login <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200">
                  {step === 'email' ? <MailCheck size={20} /> : <ShieldCheck size={20} />}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200/80">Account security</p>
                  <h2 className="text-lg font-semibold text-white">{step === 'email' ? 'Send a verification code' : 'Enter your 6-digit code'}</h2>
                </div>
              </div>

              {step === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <p className="text-sm leading-6 text-slate-300">Enter the email address used when you created your account.</p>
                  <label htmlFor="verification-email" className="block text-sm font-medium text-slate-200">Email address</label>
                  <input id="verification-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10" />
                  <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
                    {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                    Send code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-5">
                  <p className="text-sm leading-6 text-slate-300">
                    {deliveryPending
                      ? 'Your account was created, but the email could not be sent yet. Please wait for the resend option or try again later.'
                      : <>We sent a code to <strong className="text-cyan-100">{email}</strong>. It expires in 5 minutes.</>}
                  </p>
                  <OtpInput
                    value={code}
                    onChange={(value) => { setCode(value); setError('') }}
                    disabled={isLoading}
                    error={error}
                    expiresAt={otpExpiresAt}
                    onExpired={() => setIsOtpExpired(true)}
                  />
                  <button disabled={isLoading || isOtpExpired || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">
                    {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                    {isLoading ? 'Verifying email...' : 'Verify email'}
                  </button>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <button type="button" disabled={countdown > 0 || isLoading} onClick={handleResend} className="font-medium text-cyan-200 hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-500">
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                    </button>
                    <button type="button" onClick={() => { setStep('email'); setCode('') }} className="text-slate-400 hover:text-white">Change email</button>
                  </div>
                </form>
              )}
              {error && step === 'email' && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100" role="alert">{error}</p>}
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-100">
                <ArrowLeft size={15} /> Back to login
              </Link>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default VerifyEmail

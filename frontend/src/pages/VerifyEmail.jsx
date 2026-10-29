import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import { resendVerificationEmail, verifyEmail } from '../services/api'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(Boolean(searchParams.get('email')))
  const [verified, setVerified] = useState(false)
  const [message, setMessage] = useState(
    searchParams.get('email') ? 'Enter the verification code sent to your email.' : '',
  )
  const [error, setError] = useState('')

  const handleSendCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await resendVerificationEmail(email)
      setCodeSent(true)
      setMessage(result.message || 'If this address needs verification, a code will be sent.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await verifyEmail({ email, code, purpose: 'EMAIL_VERIFICATION' })
      setVerified(true)
      setMessage(result.message || 'Email verified successfully. You can now sign in.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <GlassCard className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Email verification</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Verify your email</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">We will email you a 6-digit code. Enter it here to verify your account.</p>
        {verified ? (
          <>
            <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100" role="status">{message}</p>
            <Link to="/login" className="mt-5 inline-block text-sm font-medium text-cyan-200 hover:text-white">Go to sign in</Link>
          </>
        ) : (
          <div className="mt-5 space-y-4">
            {!codeSent && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <label className="block text-sm font-medium text-slate-200" htmlFor="verify-email-address">Email address</label>
                <input
                  id="verify-email-address"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
                />
                <button type="submit" disabled={loading} className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send verification code'}
                </button>
              </form>
            )}
            {codeSent && (
              <>
                <p className="text-sm text-emerald-100" role="status">{message}</p>
                <form onSubmit={handleVerify} className="space-y-4">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="verification-code">6-digit verification code</label>
                  <input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-center font-mono text-xl tracking-[0.5em] text-white outline-none focus:border-cyan-300/50"
                  />
                  <button type="submit" disabled={loading} className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Verify email'}
                  </button>
                </form>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setCodeSent(false)
                    setCode('')
                    setMessage('')
                  }}
                  className="text-sm font-medium text-cyan-200 hover:text-white disabled:opacity-50"
                >
                  Send another code
                </button>
              </>
            )}
            {error && <p className="text-sm text-red-200" role="alert">{error}</p>}
          </div>
        )}
        {!verified && <Link to="/login" className="mt-5 inline-block text-sm font-medium text-cyan-200 hover:text-white">Back to sign in</Link>}
      </GlassCard>
    </div>
  )
}

export default VerifyEmail

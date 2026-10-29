import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import { requestPasswordReset } from '../services/api'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await requestPasswordReset(email)
      setSubmitted(true)
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, {
        replace: true,
        state: { notice: result.message },
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <GlassCard className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Account recovery</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Forgot password?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Enter your account email and we will send a password reset code if it matches an account.
        </p>
        {submitted ? (
          <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100" role="status">
            If an account exists for this address, a reset code will be sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-200" htmlFor="recovery-email">Email address</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
            />
            {error && <p className="text-sm text-red-200" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-block text-sm font-medium text-cyan-200 hover:text-white">Back to sign in</Link>
      </GlassCard>
    </div>
  )
}

export default ForgotPassword

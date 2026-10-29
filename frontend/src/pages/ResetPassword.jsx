import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import { resetPassword } from '../services/api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await resetPassword({ email, code, password, confirmPassword })
      setComplete(true)
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
        <h1 className="mt-2 text-2xl font-bold text-white">Reset password</h1>
        {complete ? (
          <>
            <p className="mt-3 text-sm text-emerald-100" role="status">Your password has been reset. You can now sign in.</p>
            <Link to="/login" className="mt-5 inline-block text-sm font-medium text-cyan-200 hover:text-white">Go to sign in</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-200" htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
            />
            <label className="block text-sm font-medium text-slate-200" htmlFor="reset-code">6-digit email code</label>
            <input
              id="reset-code"
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
            <label className="block text-sm font-medium text-slate-200" htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
            />
            <label className="block text-sm font-medium text-slate-200" htmlFor="confirm-reset-password">Confirm new password</label>
            <input
              id="confirm-reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
            />
            {error && <p className="text-sm text-red-200" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">
              {loading ? 'Updating...' : 'Verify code and reset password'}
            </button>
          </form>
        )}
        {!complete && <Link to="/forgot-password" className="mt-5 inline-block text-sm font-medium text-cyan-200 hover:text-white">Request a reset code</Link>}
      </GlassCard>
    </div>
  )
}

export default ResetPassword

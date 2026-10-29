import { Activity, Eye, EyeOff, HeartPulse, LockKeyhole, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const { t } = useLanguage()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const authNotice = window.sessionStorage.getItem('bdh_auth_notice')
    if (!authNotice) return
    window.sessionStorage.removeItem('bdh_auth_notice')
    const expired = authNotice === 'SESSION_EXPIRED'
    addToast({
      type: 'error',
      title: expired ? 'Session expired' : 'Sign-in required',
      message: expired
        ? 'Please sign in again to continue securely.'
        : 'Your session is no longer valid. Please sign in again.',
    })
  }, [addToast])

  if (isAuthenticated) {
    const destination = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
      ? '/admin'
      : location.state?.from || '/profile'
    return <Navigate to={destination} replace />
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    try {
      const authenticatedUser = await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      })

      addToast({
        type: 'success',
        title: t('loginSuccessful', 'Signed in'),
        message: t('signedIn', 'Welcome back.'),
      })

      const destination = ['ADMIN', 'SUPER_ADMIN'].includes(authenticatedUser?.role)
        ? '/admin'
        : location.state?.from || '/profile'
      navigate(destination, { replace: true })
    } catch (error) {
      addToast({
        type: 'error',
        title: t('loginFailed', 'Sign-in failed'),
        message: error.message || t('unableToSignIn', 'Please check your details and try again.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-frame" aria-labelledby="login-title">
        <div className="login-form-panel">
          <div className="login-heading">
            <p className="login-eyebrow"><span aria-hidden="true" />{t('secureAccess', 'Secure access')}</p>
            <h1 id="login-title">{t('loginTitle', 'Welcome back')}</h1>
            <p>{t('loginSubtitle', 'Sign in to access your health profile and care services.')}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">{t('email', 'Email address')}</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  placeholder={t('enterEmail', 'name@example.com')}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">{t('password', 'Password')}</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  placeholder={t('enterPassword', 'Enter your password')}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t('hidePassword', 'Hide password') : t('showPassword', 'Show password')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <Link to="/forgot-password" className="text-sm font-medium text-cyan-200 hover:text-white">
                {t('forgotPassword', 'Forgot password?')}
              </Link>
              <label className="login-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                {t('rememberMe', 'Remember me')}
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="login-submit">
              <span>{isSubmitting ? t('signingIn', 'Signing in...') : t('login', 'Sign in')}</span>
              <span className="login-submit-icon" aria-hidden="true"><ShieldCheck size={17} /></span>
            </button>
          </form>

          <div className="login-create-account">
            <span>{t('needAccount', 'New to Nirogix?')}</span>
            <Link to="/register">
              {t('createAccount', 'Create account')}
              <UserPlus size={15} aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">
            Need to verify your email? <Link to="/verify-email" className="font-medium text-cyan-200 hover:text-white">Resend verification code</Link>
          </p>
        </div>

        <aside className="login-visual" aria-label="Nirogix secure care">
          <div className="login-visual-top">
            <span className="login-visual-brand"><HeartPulse size={18} /> Nirogix</span>
            <span className="login-visual-status"><span aria-hidden="true" />Private access</span>
          </div>

          <div className="login-visual-art" aria-hidden="true">
            <div className="login-heart-ring">
              <Activity size={38} strokeWidth={1.5} />
            </div>
            <div className="login-vitals-line" />
          </div>

          <div className="login-visual-copy">
            <p>Care, connected.</p>
            <h2>Your health, in one secure place.</h2>
            <span>Access your records and trusted care services whenever you need them.</span>
          </div>

          <div className="login-visual-footer">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Private by design</span>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default Login

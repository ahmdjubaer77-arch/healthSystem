import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import SectionHeader from '../components/common/SectionHeader'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { registerUser } from '../services/api'

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: 'Female',
  division: 'Barishal',
  district: 'Barishal District',
  upazila: 'Barishal Sadar',
  area: '',
  bloodGroup: 'A+',
  termsAccepted: false,
}

const registrationSteps = [
  { label: 'Personal', title: 'Personal details', description: 'Tell us a little about yourself.' },
  { label: 'Contact', title: 'Contact details', description: 'How can we reach you?' },
  { label: 'Security', title: 'Account security', description: 'Choose a password for your account.' },
  { label: 'Address', title: 'Your address', description: 'Add your location and review your details.' },
]

function Register() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredUser, setRegisteredUser] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [passwordError, setPasswordError] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false })
  const formRef = useRef(null)
  const { t } = useLanguage()
  const { addToast } = useToast()

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (name === 'password' || name === 'confirmPassword') setPasswordError('')
  }

  const validateCurrentStep = () => {
    const currentPanel = formRef.current?.querySelector(`[data-step-panel="${activeStep}"]`)
    const invalidField = currentPanel?.querySelector(':invalid')

    if (invalidField) {
      invalidField.focus()
      invalidField.reportValidity()
      return false
    }

    return true
  }

  const handleContinue = () => {
    if (!validateCurrentStep()) return

    if (activeStep === 2 && form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match. Please check both fields.')
      return
    }

    setPasswordError('')
    setActiveStep((step) => Math.min(step + 1, registrationSteps.length - 1))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateCurrentStep()) return

    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match. Please check both fields.')
      setActiveStep(2)
      addToast({
        type: 'error',
        title: t('registrationFailed', 'Registration failed'),
        message: t('passwordMismatch', 'Passwords do not match.'),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await registerUser({
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bloodGroup: form.bloodGroup,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        location: {
          division: form.division,
          district: form.district,
          upazila: form.upazila,
          area: form.area,
        },
      })
      setRegisteredUser(result.data.user)
      setSubmitted(true)
      addToast({
        type: 'success',
        title: result.message,
        message: `Welcome, ${result.data.user.name}. Your account has been created.`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: t('registrationFailed', 'Registration failed'),
        message: error.message || t('registrationTryAgain', 'Please try again.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="register-page py-8">
        <SectionHeader
          kicker={t('createAccount', 'Create account')}
          title={t('registrationSuccessful', 'Registration complete')}
          subtitle={t('accountCreated', 'Your account has been created.')}
        />
        <GlassCard className="register-success-card max-w-2xl p-6 text-center">
          <div className="space-y-4">
            <p className="text-lg font-semibold text-white">Welcome, {registeredUser?.name || 'there'}.</p>
            <p className="text-sm text-slate-300">Your {registeredUser?.role || 'member'} account is ready.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100"
            >
              {t('goToLogin', 'Go to sign in')}
            </Link>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="register-page py-8">
      <div className="register-heading">
        <p>Create your account</p>
        <h1>Join BD Health</h1>
        <span>A few details will help us set up your account.</span>
      </div>

      <GlassCard className="auth-register-card register-card mx-auto max-w-3xl p-5 sm:p-7">
        <nav className="register-progress" aria-label="Registration progress">
          {registrationSteps.map((step, index) => (
            <button
              key={step.label}
              type="button"
              className={`register-progress-step ${index === activeStep ? 'is-current' : ''} ${index < activeStep ? 'is-complete' : ''}`}
              aria-current={index === activeStep ? 'step' : undefined}
              disabled={index > activeStep}
              onClick={() => index < activeStep && setActiveStep(index)}
            >
              <span className="register-progress-number">
                {index < activeStep ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <span className="register-progress-label">{step.label}</span>
            </button>
          ))}
        </nav>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <section className="register-step-panel" data-step-panel={activeStep} aria-labelledby="register-step-title">
            <div className="register-step-heading">
              <p>STEP {activeStep + 1} OF {registrationSteps.length}</p>
              <h2 id="register-step-title">{registrationSteps[activeStep].title}</h2>
              <span>{registrationSteps[activeStep].description}</span>
            </div>

            {activeStep === 0 && (
              <div className="register-fields">
                <div className="register-field register-field-wide">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" name="fullName" type="text" autoComplete="name" value={form.fullName} onChange={handleChange} className="register-control" placeholder="Enter your full name" required />
                </div>
                <div className="register-field">
                  <label htmlFor="dateOfBirth">Date of birth</label>
                  <input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" value={form.dateOfBirth} onChange={handleChange} className="register-control" required />
                </div>
                <div className="register-field">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="register-control">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="register-field register-field-wide">
                  <label htmlFor="bloodGroup">Blood group <span>(optional)</span></label>
                  <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="register-control">
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="register-fields">
                <div className="register-field">
                  <label htmlFor="email">Email address</label>
                  <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} className="register-control" placeholder="you@example.com" required />
                </div>
                <div className="register-field">
                  <label htmlFor="phone">Phone number</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} className="register-control" placeholder="01XXXXXXXXX" required />
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="register-fields">
                {['password', 'confirmPassword'].map((name) => {
                  const isConfirm = name === 'confirmPassword'
                  const visible = visiblePasswords[name]
                  const label = isConfirm ? 'Confirm password' : 'Password'
                  return (
                    <div className="register-field" key={name}>
                      <label htmlFor={name}>{label}</label>
                      <div className="register-password-control">
                        <LockKeyhole size={16} aria-hidden="true" />
                        <input
                          id={name}
                          name={name}
                          type={visible ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form[name]}
                          onChange={handleChange}
                          className="register-control"
                          placeholder={isConfirm ? 'Re-enter your password' : 'Create a password'}
                          aria-invalid={Boolean(passwordError && isConfirm)}
                          required
                        />
                        <button
                          type="button"
                          className="register-password-toggle"
                          aria-label={`${visible ? 'Hide' : 'Show'} ${isConfirm ? 'confirm password' : 'password'}`}
                          aria-pressed={visible}
                          onClick={() => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }))}
                        >
                          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {passwordError && <p className="register-validation-message" role="alert">{passwordError}</p>}
              </div>
            )}

            {activeStep === 3 && (
              <div className="register-fields">
                <div className="register-field">
                  <label htmlFor="division">Division</label>
                  <input id="division" name="division" type="text" autoComplete="address-level1" value={form.division} onChange={handleChange} className="register-control" placeholder="Your division" required />
                </div>
                <div className="register-field">
                  <label htmlFor="district">District</label>
                  <input id="district" name="district" type="text" autoComplete="address-level2" value={form.district} onChange={handleChange} className="register-control" placeholder="Your district" required />
                </div>
                <div className="register-field">
                  <label htmlFor="upazila">Upazila</label>
                  <input id="upazila" name="upazila" type="text" value={form.upazila} onChange={handleChange} className="register-control" placeholder="Your upazila" required />
                </div>
                <div className="register-field">
                  <label htmlFor="area">Area <span>(optional)</span></label>
                  <input id="area" name="area" type="text" autoComplete="address-line2" value={form.area} onChange={handleChange} className="register-control" placeholder="Area or neighborhood" />
                </div>
                <label className="register-terms">
                  <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange} required />
                  <span>I agree to the terms and privacy policy.</span>
                </label>
              </div>
            )}
          </section>

          <div className="register-actions">
            {activeStep > 0 ? (
              <button type="button" className="register-back-button" onClick={() => setActiveStep((step) => step - 1)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
            ) : (
              <Link to="/login" className="register-back-button">Already have an account?</Link>
            )}

            {activeStep < registrationSteps.length - 1 ? (
              <button type="button" className="register-next-button" onClick={handleContinue}>
                Continue <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="register-next-button">
                {isSubmitting ? 'Creating account...' : 'Create account'}
                <Check size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

export default Register

import { AnimatePresence, motion, useAnimation, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function OtpInput({
  value,
  onChange,
  disabled = false,
  error = '',
  expiresAt = null,
  onExpired,
  autoFocus = true,
}) {
  const inputs = useRef([])
  const onExpiredRef = useRef(onExpired)
  const reduceMotion = useReducedMotion()
  const shakeControls = useAnimation()
  const digits = `${value || ''}`.replace(/\D/g, '').slice(0, 6)
  const [secondsRemaining, setSecondsRemaining] = useState(() => (
    expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : null
  ))

  useEffect(() => {
    onExpiredRef.current = onExpired
  }, [onExpired])

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null)
      return undefined
    }

    const updateRemaining = () => {
      setSecondsRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    }
    updateRemaining()
    const timer = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  useEffect(() => {
    if (secondsRemaining === 0) onExpiredRef.current?.()
  }, [secondsRemaining])

  useEffect(() => {
    if (!error) {
      shakeControls.set({ x: 0 })
      return
    }

    shakeControls.start(reduceMotion ? { x: 0 } : { x: [0, -5, 5, -3, 3, 0] })
  }, [error, reduceMotion, shakeControls])

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus()
  }, [autoFocus])

  const isExpired = secondsRemaining === 0
  const timerLabel = secondsRemaining === null
    ? ''
    : `${Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:${(secondsRemaining % 60).toString().padStart(2, '0')}`

  const updateAt = (index, input) => {
    const incoming = input.replace(/\D/g, '')
    const next = digits.split('')

    if (incoming.length > 1) {
      incoming.slice(0, 6 - index).split('').forEach((digit, offset) => {
        next[index + offset] = digit
      })
      onChange(next.join(''))
      inputs.current[Math.min(index + incoming.length, 5)]?.focus()
      return
    }

    next[index] = incoming
    onChange(next.join(''))
    if (incoming && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Home') {
      event.preventDefault()
      inputs.current[0]?.focus()
    }
    if (event.key === 'End') {
      event.preventDefault()
      inputs.current[5]?.focus()
    }
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
  }

  const inputGroup = (
    <div
      className={`otp-input-grid ${error ? 'otp-input-grid-error' : ''} ${isExpired ? 'otp-input-grid-expired' : ''}`}
      role="group"
      aria-label="6-digit verification code"
      aria-describedby={error ? 'otp-error-message' : isExpired ? 'otp-expired-message' : secondsRemaining !== null ? 'otp-expiry-timer' : undefined}
      aria-invalid={Boolean(error || isExpired)}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element }}
          aria-label={`Verification digit ${index + 1} of 6`}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          inputMode="numeric"
          pattern="[0-9]*"
          type="text"
          maxLength={6}
          value={digits[index] || ''}
          disabled={disabled || isExpired}
          onChange={(event) => updateAt(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => {
            event.preventDefault()
            const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            onChange(pastedDigits)
            inputs.current[Math.min(pastedDigits.length, 5)]?.focus()
          }}
          className="otp-digit"
        />
      ))}
    </div>
  )

  return (
    <div className="otp-input-wrap">
      <motion.div
        animate={shakeControls}
        transition={{ duration: reduceMotion ? 0.15 : 0.32 }}
      >
        {inputGroup}
      </motion.div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="otp-error"
            id="otp-error-message"
            className="otp-status otp-status-error"
            role="alert"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
          >
            {error}
          </motion.p>
        ) : isExpired ? (
          <motion.p
            key="otp-expired"
            id="otp-expired-message"
            className="otp-status otp-status-error"
            role="alert"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
          >
            This code has expired. Request a new code to continue.
          </motion.p>
        ) : secondsRemaining !== null ? (
          <motion.p
            key="otp-timer"
            id="otp-expiry-timer"
            className="otp-status otp-status-timer"
            role="timer"
            aria-live="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Code expires in <strong>{timerLabel}</strong>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default OtpInput

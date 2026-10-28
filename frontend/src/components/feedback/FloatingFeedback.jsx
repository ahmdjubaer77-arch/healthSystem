import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, LoaderCircle, MessageSquareText, Send, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { submitFeedback } from '../../services/api'

const categories = ['General feedback', 'Bug report', 'Feature request']

function FloatingFeedback({ accessToken, isOpen, onOpen, onClose }) {
  const reduceMotion = useReducedMotion()
  const [category, setCategory] = useState(categories[0])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSent, setIsSent] = useState(false)

  const close = () => {
    onClose()
  }

  const open = () => {
    if (isSent) {
      setIsSent(false)
      setMessage('')
      setError('')
    }
    onOpen()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await submitFeedback(accessToken, { category, message })
      setIsSent(true)
    } catch (submitError) {
      setError(submitError.message || 'Unable to send your feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="feedback-widget">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            key="feedback-panel"
            className="feedback-panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.95 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-labelledby="feedback-title"
          >
            <header className="feedback-header">
              <div className="feedback-heading-icon"><MessageSquareText size={20} /></div>
              <div className="feedback-heading-copy">
                <span>Your voice matters</span>
                <h2 id="feedback-title">{isSent ? 'Thank you!' : 'Share your feedback'}</h2>
              </div>
              <button type="button" className="feedback-close" onClick={close} aria-label="Close feedback">
                <X size={18} />
              </button>
            </header>

            {isSent ? (
              <div className="feedback-success" role="status">
                <CheckCircle2 size={42} aria-hidden="true" />
                <p>Your feedback has been sent. Thanks for helping us improve Nirogix.</p>
                <button type="button" className="feedback-submit" onClick={close}>Done</button>
              </div>
            ) : (
              <form className="feedback-form" onSubmit={handleSubmit}>
                <p className="feedback-intro">Tell us what’s working or how we can make your experience better.</p>
                <label htmlFor="feedback-category">Feedback type</label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((option) => <option key={option}>{option}</option>)}
                </select>

                <div className="feedback-message-heading">
                  <label htmlFor="feedback-message">Your message</label>
                  <span>{message.length}/3000</span>
                </div>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share your thoughts with us..."
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  required
                />
                {error && <p className="feedback-error" role="alert">{error}</p>}
                <button type="submit" className="feedback-submit" disabled={isSubmitting || message.trim().length < 10}>
                  {isSubmitting ? <LoaderCircle size={17} className="feedback-spinner" /> : <Send size={16} />}
                  {isSubmitting ? 'Sending...' : 'Send feedback'}
                </button>
                <p className="feedback-privacy">Your message is sent securely to the Nirogix team.</p>
              </form>
            )}
          </motion.section>
        ) : (
          <motion.button
            key="feedback-launcher"
            type="button"
            className="feedback-launcher"
            onClick={open}
            aria-label="Open feedback form"
            title="Share feedback"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.85 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.24 }}
          >
            <MessageSquareText size={22} />
            <span className="feedback-launcher-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

export default FloatingFeedback

import { AlertCircle, ArrowRight, LoaderCircle, Send, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { sendAssistantMessage } from '../../services/api'

const copy = {
  en: {
    title: 'AI Assistant',
    subtitle: 'Here for a friendly chat',
    language: 'Chat language',
    placeholder: 'Ask here',
    send: 'Send message',
    empty: 'Hi there! What would you like to talk about?',
    loading: 'Typing…',
    clear: 'Clear chat',
    unavailable: 'Couldn’t send your message.',
    retry: 'Try again',
    signIn: 'Sign in to start chatting.',
    signInLink: 'Sign in',
    healthNote: 'Health topics get general information only—not diagnosis or personal treatment advice.',
    emergency: 'Emergency services',
    close: 'Close chat',
    open: 'Open chat assistant',
  },
  bn: {
    title: 'এআই সহকারী',
    subtitle: 'গল্প করতে পাশে আছি',
    language: 'চ্যাটের ভাষা',
    placeholder: 'এখানে লিখুন',
    send: 'বার্তা পাঠান',
    empty: 'হ্যালো! কী নিয়ে কথা বলতে চান?',
    loading: 'লিখছে…',
    clear: 'চ্যাট মুছুন',
    unavailable: 'বার্তা পাঠানো যায়নি।',
    retry: 'আবার চেষ্টা',
    signIn: 'চ্যাট করতে আগে সাইন ইন করুন।',
    signInLink: 'সাইন ইন',
    healthNote: 'স্বাস্থ্যবিষয়ক উত্তর সাধারণ তথ্য—রোগ নির্ণয় বা ব্যক্তিগত চিকিৎসার পরামর্শ নয়।',
    emergency: 'জরুরি সেবা',
    close: 'চ্যাট বন্ধ করুন',
    open: 'চ্যাট সহকারী খুলুন',
  },
}

const ChatMessage = memo(function ChatMessage({ item, language, labels, onEmergency }) {
  return (
    <div className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 ${
        item.role === 'user'
          ? 'assistant-user-message rounded-br-md border border-cyan-200/20 bg-cyan-400/15 text-cyan-50'
          : 'assistant-reply-message rounded-bl-md border border-white/10 bg-slate-800/75 text-slate-100'
      }`}>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.text}</p>
        <time className={`mt-1.5 block text-right text-[10px] ${item.role === 'user' ? 'text-cyan-100/55' : 'text-slate-500'}`}>
          {new Date(item.timestamp).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: 'numeric', minute: '2-digit' })}
        </time>
        {item.urgent && (
          <Link to="/emergency" onClick={onEmergency} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 underline underline-offset-2">
            {labels.emergency}<ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  )
})

function FloatingAssistant({ accessToken, isHealthPage = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState('bn')
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const reducedMotion = useReducedMotion()
  const messageListRef = useRef(null)
  const launcherRef = useRef(null)
  const requestControllerRef = useRef(null)
  const requestInFlightRef = useRef(false)
  const labels = copy[language]
  const closeChat = useCallback(() => {
    requestControllerRef.current?.abort()
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeChat()
        launcherRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeChat, isOpen])

  useEffect(() => () => requestControllerRef.current?.abort(), [])

  useEffect(() => {
    const messageList = messageListRef.current
    if (messageList) messageList.scrollTop = messageList.scrollHeight
  }, [messages, isSending])

  const sendMessage = async (text = draft) => {
    const message = text.trim()
    if (!message || !accessToken || requestInFlightRef.current) return

    requestInFlightRef.current = true
    const requestId = globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const randomValue = Math.floor(Math.random() * 16)
      return (character === 'x' ? randomValue : (randomValue & 0x3) | 0x8).toString(16)
    })
    const userMessageId = `${requestId}-user`
    const assistantMessageId = `${requestId}-assistant`
    const timestamp = new Date().toISOString()
    const startedAt = performance.now()
    let firstVisibleRecorded = false
    const controller = new AbortController()
    requestControllerRef.current = controller
    const conversation = messages.slice(-6).map(({ role, text: content }) => ({ role, text: content }))
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: 'user', text: message, timestamp },
      { id: assistantMessageId, role: 'assistant', text: '', timestamp: new Date().toISOString() },
    ])
    setIsSending(true)
    setError('')
    try {
      const result = await sendAssistantMessage(accessToken, message, conversation, true, language, {
        signal: controller.signal,
        requestId,
        onDelta: (delta) => {
          if (!delta) return
          setMessages((current) => current.map((item) => (
            item.id === assistantMessageId ? { ...item, text: item.text + delta } : item
          )))
          if (!firstVisibleRecorded) {
            firstVisibleRecorded = true
            requestAnimationFrame(() => requestAnimationFrame(() => {
              console.info('[chat-performance]', {
                requestId,
                requestToFirstVisibleMs: Math.round(performance.now() - startedAt),
              })
            }))
          }
        },
        onReplace: (replacement) => {
          setMessages((current) => current.map((item) => (
            item.id === assistantMessageId ? { ...item, text: replacement } : item
          )))
        },
      })
      setMessages((current) => current.map((item) => (
        item.id === assistantMessageId
          ? { ...item, urgent: result.urgent, timestamp: new Date().toISOString() }
          : item
      )))
      setDraft((current) => current.trim() === message ? '' : current)
    } catch (requestError) {
      setMessages((current) => current.filter((item) => item.id !== userMessageId && item.id !== assistantMessageId))
      if (requestError?.name !== 'AbortError') {
        setError(requestError.message || labels.unavailable)
      }
    } finally {
      requestControllerRef.current = null
      requestInFlightRef.current = false
      setIsSending(false)
      console.info('[chat-performance]', {
        requestId,
        totalResponseMs: Math.round(performance.now() - startedAt),
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void sendMessage()
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            key="floating-assistant-panel"
            role="dialog"
            aria-label={labels.title}
            aria-modal="false"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className={`assistant-panel pointer-events-auto fixed right-3 flex h-[min(620px,calc(100dvh-7rem))] w-[min(410px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[26px] border border-cyan-200/20 bg-[#071827]/95 shadow-[0_24px_70px_rgba(2,8,23,0.65)] backdrop-blur-2xl sm:right-6 ${isHealthPage ? 'bottom-[calc(6.75rem+env(safe-area-inset-bottom))] xl:bottom-24' : 'bottom-[5.75rem] sm:bottom-24'}`}
          >
            <header className="assistant-panel-header flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-900/35 via-slate-900/25 to-teal-900/25 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10">
                  <img src="/ai-assistant.png" alt="" aria-hidden="true" className="assistant-avatar-image h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">{labels.title}</h2>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{labels.subtitle}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div role="group" aria-label={labels.language} className="flex rounded-full border border-white/10 bg-slate-950/35 p-0.5">
                  {['bn', 'en'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLanguage(option)}
                      aria-pressed={language === option}
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                        language === option ? 'bg-cyan-300/15 text-cyan-100' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setMessages([]); setError('') }}
                    disabled={isSending}
                    aria-label={labels.clear}
                    title={labels.clear}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { closeChat(); launcherRef.current?.focus() }}
                  aria-label={labels.close}
                  className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div
              ref={messageListRef}
              className="assistant-message-list flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="m-auto max-w-[270px] text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200/15 bg-cyan-300/5">
                    <img src="/ai-assistant.png" alt="" aria-hidden="true" className="assistant-avatar-image h-8 w-8" />
                  </div>
                  <p className="assistant-empty-copy mt-3 text-sm text-slate-300">{labels.empty}</p>
                </div>
              )}
              {messages.map((item) => (
                <ChatMessage key={item.id} item={item} language={language} labels={labels} onEmergency={closeChat} />
              ))}
              {isSending && !messages[messages.length - 1]?.text && (
                <div className="flex justify-start">
                  <div
                    className="assistant-typing-indicator flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-slate-800/75 px-3.5 py-3"
                    role="status"
                    aria-label={labels.loading}
                  >
                    <span className="assistant-typing-dot" />
                    <span className="assistant-typing-dot" />
                    <span className="assistant-typing-dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="assistant-panel-composer border-t border-white/10 bg-slate-950/25 px-3 pb-3 pt-2.5 sm:px-4">
              {error && (
                <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-rose-300/15 bg-rose-500/10 px-2.5 py-2 text-xs text-rose-100" role="alert">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span className="break-words">{error}</span>
                  </span>
                  {accessToken && (
                    <button type="button" onClick={() => void sendMessage()} disabled={isSending} className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50">
                      {labels.retry}
                    </button>
                  )}
                </div>
              )}

              {!accessToken ? (
                <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/5 px-3 py-2.5 text-xs text-slate-300">
                  {labels.signIn}{' '}
                  <Link to="/login" onClick={closeChat} className="font-semibold text-cyan-100 underline underline-offset-2">
                    {labels.signInLink}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="assistant-composer-form flex items-end gap-2 rounded-[20px] border border-white/10 bg-slate-900/80 p-1.5 transition">
                  <textarea
                    value={draft}
                    onChange={(event) => { setDraft(event.target.value); setError('') }}
                    onKeyDown={handleKeyDown}
                    maxLength={2000}
                    rows={1}
                    placeholder={labels.placeholder}
                    aria-label={labels.placeholder}
                    className="chat-composer-input max-h-24 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:outline-none"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || isSending}
                    aria-label={labels.send}
                    title={labels.send}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/90 to-teal-400/90 text-slate-950 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </form>
              )}
              <p className="mt-1.5 px-1 text-[10px] text-slate-500">{labels.healthNote}</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        ref={launcherRef}
        onClick={() => { if (isOpen) closeChat(); else setIsOpen(true) }}
        aria-label={isOpen ? labels.close : labels.open}
        aria-expanded={isOpen}
        whileHover={reducedMotion ? undefined : { scale: 1.05 }}
        whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        className={`assistant-launcher pointer-events-auto fixed right-4 flex h-14 w-14 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:right-6 ${isHealthPage ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] xl:bottom-6' : 'bottom-4 sm:bottom-6'}`}
      >
        {isOpen ? <X size={22} /> : <img src="/ai-assistant.png" alt="" aria-hidden="true" className="assistant-avatar-image h-9 w-9" />}
      </motion.button>
    </div>,
    document.body,
  )
}

export default FloatingAssistant

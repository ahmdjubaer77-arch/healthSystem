import { Minus, Plus, RefreshCcw, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './MedicalDocumentViewer.css'

function MedicalDocumentViewer({ open, title, fileUrl, fileType, loading, error, onClose }) {
  const shouldReduceMotion = useReducedMotion()
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const dragOriginRef = useRef({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [imageError, setImageError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
      }

      if (event.key !== 'Tab') return
      const dialog = document.getElementById('medical-document-viewer')
      const focusableElements = dialog?.querySelectorAll('button:not(:disabled)')
      if (!focusableElements?.length) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open])

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setImageError(false)
    setIsDragging(false)
  }, [fileUrl])

  const changeZoom = (change) => {
    setZoom((current) => {
      const next = Math.min(4, Math.max(0.5, Number((current + change).toFixed(2))))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const handlePointerDown = (event) => {
    if (zoom <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = {
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!isDragging) return
    setPan({
      x: event.clientX - dragOriginRef.current.x,
      y: event.clientY - dragOriginRef.current.y,
    })
  }

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="medical-document-viewer"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          className="medical-document-viewer fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#020817] text-white"
          style={{ backgroundColor: '#020817', zIndex: 2147483647 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            id="medical-document-viewer"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.995 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="flex min-h-0 flex-1 flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={`Medical report preview: ${title}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="z-10 flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b1528]/95 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/75">
                  Private medical report
                </p>
                <h2 className="mt-1 truncate text-sm font-semibold text-slate-50 sm:text-base" title={title}>
                  {title}
                </h2>
              </div>

              {fileType.startsWith('image/') && (
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => changeZoom(-0.25)}
                    disabled={zoom <= 0.5}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40"
                    aria-label="Zoom out"
                    title="Zoom out"
                  >
                    <Minus size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    aria-label="Reset zoom to fit"
                    title="Reset zoom to fit"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => changeZoom(0.25)}
                    disabled={zoom >= 4}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40"
                    aria-label="Zoom in"
                    title="Zoom in"
                  >
                    <Plus size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="hidden h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:inline-flex"
                    aria-label="Fit image to screen"
                    title="Fit image to screen"
                  >
                    <RefreshCcw size={14} />
                    Fit
                  </button>
                </div>
              )}

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Close medical report preview"
                title="Close preview"
              >
                <X size={19} />
              </button>
            </header>

            <main
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_rgba(15,35,62,0.38),_transparent_68%)] p-3 sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
              }}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-sm text-slate-300" role="status">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-200 motion-reduce:animate-none" aria-hidden="true" />
                  Loading private report…
                </div>
              ) : error ? (
                <div className="max-w-md rounded-2xl border border-amber-200/15 bg-amber-200/[0.06] px-5 py-4 text-center text-sm text-amber-100" role="alert">
                  {error}
                </div>
              ) : fileType === 'application/pdf' ? (
                <iframe title={title} src={fileUrl} className="h-full w-full rounded-xl border border-white/10 bg-white" />
              ) : fileType.startsWith('image/') && fileUrl && !imageError ? (
                <img
                  src={fileUrl}
                  alt={title}
                  draggable={false}
                  onError={() => setImageError(true)}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => setIsDragging(false)}
                  onPointerCancel={() => setIsDragging(false)}
                  className="block max-h-full max-w-full select-none object-contain touch-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    transition: shouldReduceMotion || isDragging ? 'none' : 'transform 180ms ease-out',
                  }}
                />
              ) : (
                <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm text-slate-300" role="alert">
                  {imageError
                    ? 'This report image could not be displayed. Please try downloading it again.'
                    : 'This report file type cannot be displayed.'}
                </div>
              )}
            </main>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

export default MedicalDocumentViewer

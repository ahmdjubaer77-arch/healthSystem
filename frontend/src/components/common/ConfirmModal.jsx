import { AnimatePresence, motion } from 'framer-motion'

function ConfirmModal({ open, onClose, onConfirm, title, description, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_30px_80px_rgba(2,8,23,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-300">{description}</p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full border border-red-300/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmModal

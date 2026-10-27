import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const iconMap = {
  success: CheckCircle2,
  error: TriangleAlert,
  warning: TriangleAlert,
  info: Info,
}

const paletteMap = {
  success: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-50',
  error: 'border-red-300/30 bg-red-500/10 text-red-50',
  warning: 'border-amber-300/30 bg-amber-500/10 text-amber-50',
  info: 'border-cyan-300/30 bg-cyan-500/10 text-cyan-50',
}

function Toast({ items = [], onClose }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[90] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => {
          const Icon = iconMap[item.type] || Info

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: -8 }}
              className={`pointer-events-auto overflow-hidden rounded-[22px] border backdrop-blur-xl ${paletteMap[item.type] || paletteMap.info}`}
            >
              <div className="flex items-start gap-3 p-3.5">
                <div className="mt-0.5 rounded-full bg-slate-950/20 p-1.5">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  {item.title && <p className="text-sm font-semibold">{item.title}</p>}
                  {item.message && <p className="mt-1 text-xs text-current/80">{item.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onClose(item.id)}
                  className="rounded-full p-1 transition hover:bg-slate-950/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label="Close notification"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default Toast

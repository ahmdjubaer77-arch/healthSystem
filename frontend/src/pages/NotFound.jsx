import { Home, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <GlassCard className="w-full max-w-xl p-6 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">404</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-300">
          The page you are looking for does not exist in this prototype frontend.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100"
          >
            <Home size={15} />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

export default NotFound

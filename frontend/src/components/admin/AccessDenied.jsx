import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../common/ErrorState'

function AccessDenied({
  title = 'Access denied',
  description = 'This area is restricted to ADMIN and SUPER_ADMIN accounts.',
} = {}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <ErrorState
        title={title}
        description={description}
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
          >
            <LockKeyhole size={14} />
            Return home
          </Link>
        }
      />
    </div>
  )
}

export default AccessDenied

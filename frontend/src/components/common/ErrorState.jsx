import { AlertTriangle } from 'lucide-react'

function ErrorState({ title = 'Something went wrong', description = 'Please try again.', action }) {
  return (
    <div className="rounded-[26px] border border-red-400/20 bg-red-500/8 p-6 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-500/12 p-2 text-red-200">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-200">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export default ErrorState

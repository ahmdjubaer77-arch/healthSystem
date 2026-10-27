function LoadingState({ message = 'Loading...', compact = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/20 p-4 text-slate-200 ${compact ? 'min-h-[120px]' : 'min-h-[200px]'}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/50 border-t-cyan-200" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}

export default LoadingState

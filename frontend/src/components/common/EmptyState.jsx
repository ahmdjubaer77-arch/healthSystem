function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[26px] border border-dashed border-white/15 bg-slate-950/20 p-6 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState

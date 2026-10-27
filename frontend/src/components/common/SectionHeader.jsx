function SectionHeader({ kicker, title, subtitle, align = 'left' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left'

  return (
    <div className={`mb-6 max-w-2xl ${alignment}`}>
      {kicker && (
        <p className="mb-3 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
          {kicker}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-[-0.04em] text-white sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-slate-300 sm:text-base">{subtitle}</p>}
    </div>
  )
}

export default SectionHeader

function GlassCard({ children, className = '', as: Component = 'div', ...props }) {
  const baseClass =
    'glass-panel material-surface rounded-2xl border border-[var(--page-border)] bg-[var(--page-surface-raised)] shadow-[var(--page-shadow)]'

  return (
    <Component className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

export default GlassCard

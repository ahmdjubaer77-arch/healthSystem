function GlassCard({ children, className = '', as: Component = 'div', ...props }) {
  const baseClass =
    'glass-panel rounded-[28px] border border-white/15 bg-white/7 shadow-[0_20px_40px_rgba(8,15,25,0.18)] backdrop-blur-xl'

  return (
    <Component className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

export default GlassCard

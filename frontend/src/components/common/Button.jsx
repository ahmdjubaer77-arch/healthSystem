import { ArrowRight } from 'lucide-react'

function Button({ children, variant = 'primary', size = 'md', className = '', icon = false, ...props }) {
  const variants = {
    primary:
      'border border-cyan-300/40 bg-cyan-400/20 text-white shadow-[0_10px_30px_rgba(34,211,238,0.18)] hover:bg-cyan-400/30',
    secondary:
      'border border-white/15 bg-white/7 text-white hover:bg-white/12',
    emergency:
      'border border-red-300/40 bg-red-500/20 text-red-50 shadow-[0_10px_30px_rgba(239,68,68,0.18)] hover:bg-red-500/30',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm sm:px-5',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...props}
    >
      {children}
      {icon && <ArrowRight size={16} />}
    </button>
  )
}

export default Button

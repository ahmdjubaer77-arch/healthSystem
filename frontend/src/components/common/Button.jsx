import { ArrowRight } from 'lucide-react'

function Button({ children, variant = 'primary', size = 'md', className = '', icon = false, ...props }) {
  const variants = {
    primary: 'material-button-primary',
    secondary: 'material-button-secondary',
    emergency: 'material-button-emergency',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm sm:px-5',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <button
      className={`material-button inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...props}
    >
      {children}
      {icon && <ArrowRight size={16} />}
    </button>
  )
}

export default Button

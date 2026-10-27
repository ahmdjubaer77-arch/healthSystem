import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

function AdminBreadcrumb({ items = [] }) {
  return (
    <nav className="mb-5 flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
      <Link to="/admin" className="inline-flex items-center gap-1.5 transition hover:text-cyan-200">
        <Home size={13} />
        Home
      </Link>
      {items.map((item, index) => (
        <span key={item.path || item.label} className="inline-flex items-center gap-2">
          <ChevronRight size={12} />
          {item.path ? (
            <Link to={item.path} className="transition hover:text-cyan-200">{item.label}</Link>
          ) : (
            <span className="text-slate-300">{item.label}</span>
          )}
          {index === items.length - 1 && <span className="sr-only">Current page</span>}
        </span>
      ))}
    </nav>
  )
}

export default AdminBreadcrumb

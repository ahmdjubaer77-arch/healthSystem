import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Grid2X2 } from 'lucide-react'
import { navItems } from '../../config/navigation'
import { useLanguage } from '../../context/LanguageContext'

function DesktopNav() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const [servicesOpen, setServicesOpen] = useState(false)
  const servicesRef = useRef(null)
  const primaryItems = navItems.filter((item) => ['/', '/health', '/emergency'].includes(item.path))
  const serviceItems = navItems.filter((item) => !primaryItems.includes(item))
  const isServiceActive = serviceItems.some(({ path }) => pathname === path || pathname.startsWith(`${path}/`))

  useEffect(() => {
    setServicesOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!servicesOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!servicesRef.current?.contains(event.target)) setServicesOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setServicesOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [servicesOpen])

  const navLinkClass = ({ isActive }, highlighted = false) => {
    if (highlighted) {
      return `navbar-link navbar-link-emergency inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'navbar-link-active'
          : 'text-red-600 hover:bg-red-500/10'
      }`
    }

    return `navbar-link inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'navbar-link-active'
        : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
    }`
  }

  return (
    <div className="navbar-links hidden min-w-0 items-center justify-center xl:flex">
      {primaryItems.filter((item) => !item.highlight).map((item) => (
        <NavLink key={item.path} to={item.path} className={(state) => navLinkClass(state)}>
          {item.icon && <item.icon size={18} strokeWidth={2.2} aria-hidden="true" />}
          <span>{t(item.translationKey)}</span>
        </NavLink>
      ))}

      <div
        ref={servicesRef}
        className="navbar-service-item relative"
        onMouseEnter={() => setServicesOpen(true)}
        onMouseLeave={() => setServicesOpen(false)}
      >
        <button
          type="button"
          aria-expanded={servicesOpen}
          aria-current={isServiceActive ? 'page' : undefined}
          aria-haspopup="true"
          onClick={() => setServicesOpen((open) => !open)}
          className={`navbar-link navbar-services-link inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            isServiceActive || servicesOpen ? 'navbar-link-active' : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Grid2X2 size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>Services</span>
          <ChevronDown size={15} className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {servicesOpen && (
          <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-2">
            <div className="nav-dropdown rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_45px_rgba(2,8,23,0.4)] backdrop-blur-2xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Explore services
              </p>
              <div className="space-y-1">
                {serviceItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setServicesOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-cyan-400/15 text-white'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={16} className="text-cyan-200" aria-hidden="true" />
                    <span>{t(item.translationKey)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {primaryItems.filter((item) => item.highlight).map((item) => (
        <NavLink key={item.path} to={item.path} className={(state) => navLinkClass(state, true)}>
          {item.icon && <item.icon size={18} strokeWidth={2.2} aria-hidden="true" />}
          <span>{t(item.translationKey)}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default DesktopNav

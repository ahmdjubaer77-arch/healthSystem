import { NavLink } from 'react-router-dom'
import { navItems } from '../../config/navigation'
import { useLanguage } from '../../context/LanguageContext'

const primaryPaths = ['/', '/medicines', '/hospitals', '/doctors', '/blood', '/emergency']

function DesktopNav() {
  const { t } = useLanguage()
  const primaryItems = primaryPaths
    .map((path) => navItems.find((item) => item.path === path))
    .filter(Boolean)

  return (
    <div className="navbar-links hidden min-w-0 items-center justify-center lg:flex">
      {primaryItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `navbar-link inline-flex items-center justify-center rounded-full ${
              item.highlight ? 'navbar-link-emergency' : ''
            }${isActive ? ' navbar-link-active' : ''}`
          }
        >
          <span>{item.path === '/' ? t('home', 'Home') : t(item.translationKey)}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default DesktopNav

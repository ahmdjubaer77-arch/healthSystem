import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default ProtectedRoute

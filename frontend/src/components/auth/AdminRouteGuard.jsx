import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AdminPermissionProvider } from '../../context/AdminPermissionContext'
import { checkAdminAuthorization } from '../../services/api'
import AdminLoadingState from '../admin/AdminLoadingState'
import AccessDenied from '../admin/AccessDenied'

function AdminRouteGuard({ children }) {
  const { accessToken, logout } = useAuth()
  const location = useLocation()
  const [authorizationState, setAuthorizationState] = useState('checking')
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    let active = true

    const authorize = async () => {
      if (!accessToken) {
        setAuthorizationState('unauthenticated')
        return
      }

      try {
        const result = await checkAdminAuthorization(accessToken)
        if (active && result?.authenticated === true && result?.admin === true) {
          setPermissions(result.permissions || [])
          setAuthorizationState('authorized')
          return
        }
        if (active) setAuthorizationState('forbidden')
      } catch (error) {
        if (!active) return

        if (error?.status === 401 || error?.status === 403) {
          logout()
          setAuthorizationState('unauthenticated')
          return
        }

        setAuthorizationState('unavailable')
      }
    }

    authorize()
    return () => {
      active = false
    }
  }, [accessToken, logout])

  if (authorizationState === 'checking') {
    return <AdminLoadingState message="Verifying administrator access…" />
  }

  if (authorizationState === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (authorizationState === 'forbidden') {
    return <AccessDenied />
  }

  if (authorizationState === 'unavailable') {
    return (
      <AccessDenied
        title="Admin service unavailable"
        description="The backend could not verify your administrator access. Please try again later."
      />
    )
  }

  return <AdminPermissionProvider permissions={permissions}>{children}</AdminPermissionProvider>
}

export default AdminRouteGuard

import { Navigate } from 'react-router-dom'

function PublicPageRedirect() {
  return <Navigate to="/admin" replace />
}

export default PublicPageRedirect

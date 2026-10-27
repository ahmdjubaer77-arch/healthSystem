import { createContext, useContext, useMemo, useState } from 'react'

const AdminPermissionContext = createContext(null)

function AdminPermissionProvider({ children, permissions = [] }) {
  const [availablePermissions] = useState(permissions)
  const hasPermission = (permission) => availablePermissions.includes(permission)
  const value = useMemo(
    () => ({ permissions: availablePermissions, hasPermission }),
    [availablePermissions],
  )

  return (
    <AdminPermissionContext.Provider value={value}>
      {children}
    </AdminPermissionContext.Provider>
  )
}

function useAdminPermissions() {
  const context = useContext(AdminPermissionContext)

  if (!context) {
    throw new Error('useAdminPermissions must be used within AdminPermissionProvider')
  }

  return context
}

export { AdminPermissionProvider, useAdminPermissions }

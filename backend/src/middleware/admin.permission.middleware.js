const { adminAuthorization } = require('./admin.authorization.middleware')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../constants/admin.permissions')

function getRolePermissions(role) {
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_ROLE_PERMISSIONS
  if (role === 'ADMIN') return ADMIN_ROLE_PERMISSIONS
  return new Set()
}

function requireAdminPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user || !permissions.length) {
      const error = new Error('Authentication required')
      error.statusCode = 401
      return next(error)
    }

    const userPermissions = getRolePermissions(req.user.role)
    const missingPermissions = permissions.filter((permission) => !userPermissions.has(permission))

    if (missingPermissions.length > 0) {
      const error = new Error('Insufficient permissions')
      error.statusCode = 403
      return next(error)
    }

    req.user.permissions = [...userPermissions]
    return next()
  }
}

function adminPermission(...permissions) {
  return (req, res, next) => {
    adminAuthorization(req, res, (authorizationError) => {
      if (authorizationError) return next(authorizationError)
      return requireAdminPermission(...permissions)(req, res, next)
    })
  }
}

function adminPermissionAny(...permissions) {
  return (req, res, next) => {
    adminAuthorization(req, res, (authorizationError) => {
      if (authorizationError) return next(authorizationError)

      const userPermissions = new Set(req.user.permissions || [])
      if (!permissions.some((permission) => userPermissions.has(permission))) {
        const error = new Error('Insufficient permissions')
        error.statusCode = 403
        return next(error)
      }

      return next()
    })
  }
}

module.exports = { adminPermission, adminPermissionAny, requireAdminPermission }

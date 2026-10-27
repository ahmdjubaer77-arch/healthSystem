const User = require('../models/User')
const { authenticate } = require('./auth.middleware')
const { requireRole } = require('./role.middleware')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../constants/admin.permissions')

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

function getRolePermissions(role) {
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_ROLE_PERMISSIONS
  if (role === 'ADMIN') return ADMIN_ROLE_PERMISSIONS
  return new Set()
}

function adminAuthorization(req, res, next) {
  authenticate(req, res, (authenticationError) => {
    if (authenticationError) return next(authenticationError)

    const roleCheck = requireRole(...ADMIN_ROLES)
    return roleCheck(req, res, async (authorizationError) => {
      if (authorizationError) return next(authorizationError)

      try {
        const user = await User.findById(req.user.userId)
          .select('role accountStatus')
          .lean()

        if (!user || user.accountStatus !== 'ACTIVE') {
          const error = new Error('Admin access is unavailable')
          error.statusCode = 403
          return next(error)
        }

        if (!ADMIN_ROLES.has(user.role)) {
          const error = new Error('Insufficient permissions')
          error.statusCode = 403
          return next(error)
        }

        req.user.role = user.role
        req.user.permissions = [...getRolePermissions(user.role)]
        return next()
      } catch (error) {
        return next(error)
      }
    })
  })
}

module.exports = { adminAuthorization }

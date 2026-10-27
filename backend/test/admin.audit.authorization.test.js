const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')
const { adminPermission, requireAdminPermission } = require('../src/middleware/admin.permission.middleware')

test('audit-log permission is exclusive to SUPER_ADMIN in the centralized role permissions', () => {
  assert.equal(ADMIN_ROLE_PERMISSIONS.has('auditLogs.read'), false)
  assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has('auditLogs.read'), true)

  let error
  const adminRequest = { user: { userId: 'admin-id', role: 'ADMIN' } }
  requireAdminPermission('auditLogs.read')(adminRequest, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 403)

  error = null
  const superAdminRequest = { user: { userId: 'super-admin-id', role: 'SUPER_ADMIN' } }
  requireAdminPermission('auditLogs.read')(superAdminRequest, {}, (nextError) => { error = nextError })
  assert.equal(error, undefined)
  assert.deepEqual(superAdminRequest.user.permissions, [...SUPER_ADMIN_ROLE_PERMISSIONS])
  assert.equal(superAdminRequest.user.permissions.includes('blood.moderate'), true)

  error = null
  requireAdminPermission('auditLogs.read')({ user: { userId: 'patient-id', role: 'PATIENT' } }, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 403)

  error = null
  adminPermission('auditLogs.read')({ get: () => '' }, {}, (nextError) => { error = nextError })
  assert.equal(error.statusCode, 401)
})
const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const User = require('../src/models/User')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const userService = require('../src/services/user.service')
const adminUserService = require('../src/services/admin.user.service')

const originalFindById = User.findById
const originalAuditCreate = AdminAuditLog.create
const originalDeleteUserAccountData = userService.deleteUserAccountData

after(() => {
  User.findById = originalFindById
  AdminAuditLog.create = originalAuditCreate
  userService.deleteUserAccountData = originalDeleteUserAccountData
})

test('admin user deletion rejects self-deletion and administrator accounts', async () => {
  const actor = { userId: '65a000000000000000000001', role: 'ADMIN' }
  const target = { _id: { toString: () => '65a000000000000000000002' }, role: 'PATIENT' }

  User.findById = async (id) => id === actor.userId ? { ...target, _id: { toString: () => actor.userId } } : target
  await assert.rejects(adminUserService.deleteUser(actor.userId, actor), { statusCode: 400 })

  User.findById = async () => ({ ...target, role: 'SUPER_ADMIN' })
  await assert.rejects(adminUserService.deleteUser(target._id.toString(), actor), { statusCode: 403 })
})

test('admin user deletion erases account data and records an audit event', async () => {
  const actor = { userId: '65a000000000000000000001', role: 'ADMIN', ipAddress: '127.0.0.1', userAgent: 'test' }
  const target = {
    _id: { toString: () => '65a000000000000000000003' },
    role: 'PATIENT',
    accountStatus: 'SUSPENDED',
  }
  let deletedAccount
  let auditEvent

  User.findById = async () => target
  userService.deleteUserAccountData = async (id, actorId, account) => {
    deletedAccount = { id, actorId, account }
    return { deleted: true }
  }
  AdminAuditLog.create = async (event) => { auditEvent = event }

  const result = await adminUserService.deleteUser(target._id.toString(), actor)

  assert.deepEqual(result, { deleted: true, id: target._id.toString() })
  assert.equal(deletedAccount.id, target._id)
  assert.equal(deletedAccount.actorId, actor.userId)
  assert.equal(deletedAccount.account, target)
  assert.equal(auditEvent.action, 'user.delete')
  assert.equal(auditEvent.actorId, actor.userId)
  assert.equal(auditEvent.targetUser, target._id)
  assert.deepEqual(auditEvent.details, { role: 'PATIENT', accountStatus: 'SUSPENDED' })
})

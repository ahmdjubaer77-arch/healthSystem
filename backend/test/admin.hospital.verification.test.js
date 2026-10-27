const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const hospitalService = require('../src/services/admin.hospital.service')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')
const { adminPermission, requireAdminPermission } = require('../src/middleware/admin.permission.middleware')

const auditEntries = []
const originalFindOne = Provider.findOne
const originalAuditCreate = AdminAuditLog.create

function createHospital() {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Central Hospital',
    providerType: 'Hospital',
    verificationStatus: 'PENDING',
    verificationReason: '',
    verifiedAt: null,
    suspendedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    async save() { this.updatedAt = new Date(); return this },
  }
}

const hospital = createHospital()
Provider.findOne = (filter) => ({
  then(resolve, reject) {
    const matches = filter.providerType === hospital.providerType && filter._id.toString() === hospital._id.toString()
    return Promise.resolve(matches ? hospital : null).then(resolve, reject)
  },
  lean() { return Promise.resolve(hospital) },
})
AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }

after(() => {
  Provider.findOne = originalFindOne
  AdminAuditLog.create = originalAuditCreate
})

test('hospital verification, rejection, suspension, restore, audit, and authorization', async () => {
  for (const permission of ['hospitals.read', 'hospitals.verify', 'hospitals.update']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  let authorizationError
  adminPermission('hospitals.verify')({ get: () => '' }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 401)
  requireAdminPermission('hospitals.verify')({ user: { role: 'PATIENT' } }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 403)

  const actor = { userId: new mongoose.Types.ObjectId(), role: 'ADMIN' }
  await assert.rejects(hospitalService.updateHospitalVerification(hospital._id.toString(), 'REJECTED', '', actor), { statusCode: 400 })
  const verified = await hospitalService.updateHospitalVerification(hospital._id.toString(), 'VERIFIED', '', actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  const rejected = await hospitalService.updateHospitalVerification(hospital._id.toString(), 'REJECTED', 'License is expired', actor)
  assert.equal(rejected.verificationStatus, 'REJECTED')
  assert.equal(rejected.verificationReason, 'License is expired')
  const suspended = await hospitalService.updateHospitalStatus(hospital._id.toString(), 'SUSPENDED', actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  const restored = await hospitalService.updateHospitalStatus(hospital._id.toString(), 'RESTORE', actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')
  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'hospital.verified',
    'hospital.rejected',
    'hospital.suspended',
    'hospital.restored',
  ])
})
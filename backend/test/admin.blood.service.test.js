const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const BloodRequest = require('../src/models/BloodRequest')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const bloodService = require('../src/services/admin.blood.service')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')
const { adminPermission, requireAdminPermission } = require('../src/middleware/admin.permission.middleware')

const requests = []
const auditEntries = []
const originalMethods = {
  find: BloodRequest.find,
  findById: BloodRequest.findById,
  countDocuments: BloodRequest.countDocuments,
  auditCreate: AdminAuditLog.create,
}

function matches(request, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(request, condition))
    if (key === '$or') return expected.some((condition) => matches(request, condition))
    const value = request[key]
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    return value?.toString() === expected?.toString()
  })
}

function createRequest(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    requesterId: new mongoose.Types.ObjectId(),
    requesterName: 'Private Requester',
    bloodGroup: 'O+',
    quantity: 2,
    unit: 'bags',
    hospitalId: new mongoose.Types.ObjectId(),
    hospitalName: 'Central Hospital',
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Uttara',
    locationType: 'Hospital',
    status: 'PENDING',
    verificationStatus: 'PENDING',
    verificationReason: '',
    reportReason: '',
    metadata: { privateContact: 'do-not-return' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    async save() { this.updatedAt = new Date(); return this },
  }
}

function installModelStubs() {
  BloodRequest.find = (filter) => {
    let result = requests.filter((request) => matches(request, filter))
    return {
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map((request) => ({ ...request }))) },
    }
  }
  BloodRequest.findById = (id) => {
    const request = requests.find((entry) => entry._id.toString() === id.toString()) || null
    return {
      lean() { return Promise.resolve(request ? { ...request } : null) },
      then(resolve, reject) { return Promise.resolve(request).then(resolve, reject) },
    }
  }
  BloodRequest.countDocuments = async (filter) => requests.filter((request) => matches(request, filter)).length
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

installModelStubs()

after(() => {
  BloodRequest.find = originalMethods.find
  BloodRequest.findById = originalMethods.findById
  BloodRequest.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
})

test('blood request active filter, details, moderation, flags, and permissions', async () => {
  for (const permission of ['blood.read', 'blood.moderate']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }
  let authorizationError
  adminPermission('blood.read')({ get: () => '' }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 401)
  requireAdminPermission('blood.read')({ user: { role: 'PATIENT' } }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 403)
  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['blood.read', 'blood.moderate'],
    ipAddress: '127.0.0.1',
  }
  const pending = createRequest()
  const active = createRequest({
    requesterName: 'Active Requester',
    status: 'ACTIVE',
    bloodGroup: 'A+',
    district: 'Gazipur',
    upazila: 'Tongi',
  })
  const matched = createRequest({ status: 'MATCHED' })
  requests.push(pending, active, matched)

  const activePage = await bloodService.getBloodRequests({ status: 'ACTIVE', page: '1', limit: '1' })
  assert.equal(activePage.pagination.total, 1)
  assert.equal(activePage.requests[0].id, active._id.toString())
  assert.equal(activePage.requests[0].requesterName, 'Active Requester')
  assert.equal((await bloodService.getBloodRequests({ bloodGroup: 'A+' })).pagination.total, 1)
  assert.equal((await bloodService.getBloodRequests({ location: 'Gazipur' })).pagination.total, 1)
  assert.equal((await bloodService.getBloodRequests({ search: 'Active Requester' })).pagination.total, 1)
  await assert.rejects(bloodService.getBloodRequests({ status: 'UNKNOWN' }), { statusCode: 400 })
  await assert.rejects(bloodService.getBloodRequests({ bloodGroup: 'invalid' }), { statusCode: 400 })
  await assert.rejects(bloodService.getBloodRequests({ extra: 'unsupported' }), { statusCode: 400 })

  const details = await bloodService.getBloodRequestById(pending._id.toString())
  assert.equal(details.requesterName, pending.requesterName)
  assert.equal(Object.hasOwn(details, 'requesterId'), false)
  assert.equal(Object.hasOwn(details, 'hospitalId'), false)
  assert.equal(Object.hasOwn(details, 'metadata'), false)

  await assert.rejects(
    bloodService.updateBloodRequestStatus(pending._id.toString(), { status: 'ACTIVE' }, { permissions: [] }),
    { statusCode: 403 },
  )
  await assert.rejects(
    bloodService.updateBloodRequestStatus(pending._id.toString(), { status: 'CANCELLED' }, actor),
    { statusCode: 400 },
  )
  const updated = await bloodService.updateBloodRequestStatus(pending._id.toString(), { status: 'ACTIVE' }, actor)
  assert.equal(updated.status, 'ACTIVE')
  await assert.rejects(
    bloodService.updateBloodRequestStatus(pending._id.toString(), { status: 'MATCHED' }, actor),
    { statusCode: 409 },
  )
  await assert.rejects(
    bloodService.updateBloodRequestStatus(matched._id.toString(), { status: 'FULFILLED' }, actor),
    { statusCode: 409 },
  )

  const flagged = await bloodService.reportBloodRequest(active._id.toString(), { reason: 'Request details need review' }, actor)
  assert.equal(flagged.status, 'ACTIVE')
  assert.equal(flagged.reportReason, 'Request details need review')
  assert.ok(flagged.reportedAt)
  await assert.rejects(
    bloodService.reportBloodRequest(active._id.toString(), { reason: 'Suspicious' }, { permissions: [] }),
    { statusCode: 403 },
  )

  const cancelled = await bloodService.updateBloodRequestStatus(active._id.toString(), {
    status: 'CANCELLED',
    reason: 'Fraudulent request',
  }, actor)
  assert.equal(cancelled.status, 'CANCELLED')
  assert.equal(cancelled.reportReason, 'Request details need review')
  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'BLOOD_REQUEST_STATUS_UPDATED',
    'BLOOD_REQUEST_FLAGGED',
    'BLOOD_REQUEST_STATUS_UPDATED',
  ])
})
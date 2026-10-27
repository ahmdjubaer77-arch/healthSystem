const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const EmergencyRequest = require('../src/models/EmergencyRequest')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const emergencyService = require('../src/services/admin.emergency.service')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')
const { adminPermission, requireAdminPermission } = require('../src/middleware/admin.permission.middleware')

const requests = []
const auditEntries = []
const originalMethods = {
  find: EmergencyRequest.find,
  findById: EmergencyRequest.findById,
  countDocuments: EmergencyRequest.countDocuments,
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
    requestType: 'Medical transport',
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Uttara',
    locationType: 'Residential area',
    hospitalId: new mongoose.Types.ObjectId(),
    hospitalName: 'Central Hospital',
    ambulanceId: new mongoose.Types.ObjectId(),
    ambulanceName: 'City Ambulance Service',
    status: 'PENDING',
    verificationStatus: 'PENDING',
    verificationReason: '',
    metadata: { exactLocation: 'private coordinates', contactPhone: 'private phone' },
    createdAt: new Date(),
    updatedAt: new Date(),
    async save() { this.updatedAt = new Date(); return this },
    ...data,
  }
}

function installModelStubs() {
  EmergencyRequest.find = (filter) => {
    let result = requests.filter((request) => matches(request, filter))
    return {
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map((request) => ({ ...request }))) },
    }
  }
  EmergencyRequest.findById = (id) => {
    const request = requests.find((entry) => entry._id.toString() === id.toString()) || null
    return {
      lean() { return Promise.resolve(request ? { ...request } : null) },
      then(resolve, reject) { return Promise.resolve(request).then(resolve, reject) },
    }
  }
  EmergencyRequest.countDocuments = async (filter) => requests.filter((request) => matches(request, filter)).length
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

installModelStubs()

after(() => {
  EmergencyRequest.find = originalMethods.find
  EmergencyRequest.findById = originalMethods.findById
  EmergencyRequest.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
})

test('emergency search, filters, details, workflow audit, and normal-user access denial', async () => {
  for (const permission of ['emergency.read', 'emergency.manage']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  let authorizationError
  adminPermission('emergency.read')({ get: () => '' }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 401)
  requireAdminPermission('emergency.read')({ user: { role: 'PATIENT' } }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 403)

  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['emergency.read', 'emergency.manage'],
    ipAddress: '127.0.0.1',
  }
  const pending = createRequest()
  const active = createRequest({
    requesterName: 'Active Requester',
    requestType: 'Medical transport',
    district: 'Gazipur',
    status: 'IN_PROGRESS',
  })
  requests.push(pending, active)

  const filtered = await emergencyService.getEmergencyRequests({ status: 'IN_PROGRESS', requestType: 'medical transport', location: 'Gazipur', page: '1', limit: '5' })
  assert.equal(filtered.pagination.total, 1)
  assert.equal(filtered.requests[0].id, active._id.toString())
  assert.equal((await emergencyService.getEmergencyRequests({ search: 'Active Requester' })).pagination.total, 1)
  await assert.rejects(emergencyService.getEmergencyRequests({ status: 'UNKNOWN' }), { statusCode: 400 })
  await assert.rejects(emergencyService.getEmergencyRequests({ extra: 'field' }), { statusCode: 400 })

  const details = await emergencyService.getEmergencyRequestById(pending._id.toString())
  assert.equal(details.hospitalName, 'Central Hospital')
  assert.equal(details.ambulanceName, 'City Ambulance Service')
  assert.equal(details.division, 'Dhaka')
  assert.equal(Object.hasOwn(details, 'requesterId'), false)
  assert.equal(Object.hasOwn(details, 'hospitalId'), false)
  assert.equal(Object.hasOwn(details, 'ambulanceId'), false)
  assert.equal(Object.hasOwn(details, 'metadata'), false)
  assert.equal(JSON.stringify(details).includes('private coordinates'), false)
  assert.equal(JSON.stringify(details).includes('private phone'), false)

  await assert.rejects(
    emergencyService.updateEmergencyRequestStatus(pending._id.toString(), { status: 'IN_PROGRESS' }, { permissions: [] }),
    { statusCode: 403 },
  )
  const started = await emergencyService.updateEmergencyRequestStatus(pending._id.toString(), { status: 'IN_PROGRESS' }, actor)
  assert.equal(started.status, 'IN_PROGRESS')
  await assert.rejects(
    emergencyService.updateEmergencyRequestStatus(pending._id.toString(), { status: 'CANCELLED' }, actor),
    { statusCode: 400 },
  )
  const resolved = await emergencyService.updateEmergencyRequestStatus(pending._id.toString(), { status: 'RESOLVED' }, actor)
  assert.equal(resolved.status, 'RESOLVED')
  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'emergency.request.in_progress',
    'emergency.request.resolved',
  ])
})
const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const BloodRequest = require('../src/models/BloodRequest')
const User = require('../src/models/User')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const bloodRequestService = require('../src/services/blood.request.service')

const requests = []
const users = new Map()
const auditEntries = []
const originalMethods = {
  userFindById: User.findById,
  requestFind: BloodRequest.find,
  requestFindOne: BloodRequest.findOne,
  requestCreate: BloodRequest.create,
  requestCount: BloodRequest.countDocuments,
  auditCreate: AdminAuditLog.create,
}

function matches(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(record, condition))
    if (key === '$or') return expected.some((condition) => matches(record, condition))
    const value = record[key]
    if (expected?.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    return value?.toString() === expected?.toString()
  })
}

function findQuery(items) {
  let result = items
  return {
    sort() { return this },
    skip(count) { result = result.slice(count); return this },
    limit(count) { result = result.slice(0, count); return this },
    lean() { return Promise.resolve(result.map((record) => ({ ...record }))) },
  }
}

User.findById = (id) => ({
  select() {
    const user = users.get(id.toString()) || null
    return { lean: () => Promise.resolve(user) }
  },
})
BloodRequest.create = async (data) => {
  const request = {
    _id: new mongoose.Types.ObjectId(),
    status: 'PENDING',
    verificationStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    async save() { this.updatedAt = new Date(); return this },
  }
  requests.push(request)
  return request
}
BloodRequest.find = (filter) => findQuery(requests.filter((request) => matches(request, filter)))
BloodRequest.findOne = (filter) => {
  const request = requests.find((entry) => matches(entry, filter)) || null
  return {
    lean: () => Promise.resolve(request),
    then(resolve, reject) { return Promise.resolve(request).then(resolve, reject) },
  }
}
BloodRequest.countDocuments = async (filter) => requests.filter((request) => matches(request, filter)).length
AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }

after(() => {
  User.findById = originalMethods.userFindById
  BloodRequest.find = originalMethods.requestFind
  BloodRequest.findOne = originalMethods.requestFindOne
  BloodRequest.create = originalMethods.requestCreate
  BloodRequest.countDocuments = originalMethods.requestCount
  AdminAuditLog.create = originalMethods.auditCreate
})

test('authenticated blood requests start pending and keep contact details private without consent', async () => {
  const userId = new mongoose.Types.ObjectId()
  users.set(userId.toString(), { name: 'Account Holder', accountStatus: 'ACTIVE' })
  const created = await bloodRequestService.createBloodRequest(userId.toString(), {
    bloodGroup: 'O+',
    quantity: 2,
    hospitalName: 'Central Hospital',
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Uttara',
    urgency: 'URGENT',
    contactPhone: '+8801712345678',
    contactPhoneConsent: false,
    notes: 'Logistics note',
  })

  assert.equal(created.requesterName, 'Account Holder')
  assert.equal(created.status, 'PENDING')
  assert.equal(created.verificationStatus, 'PENDING')
  const stored = requests[0]
  assert.equal(stored.contactPhone, '')
  assert.equal(stored.contactPerson, '')
  assert.equal(stored.requestNotes, 'Logistics note')
  assert.equal(auditEntries[0].action, 'BLOOD_REQUEST_CREATED')

  stored.status = 'ACTIVE'
  stored.verificationStatus = 'VERIFIED'
  const publicResult = await bloodRequestService.getPublicBloodRequests({})
  assert.equal(publicResult.pagination.total, 1)
  assert.equal(publicResult.requests[0].bloodGroup, 'O+')
  assert.equal(Object.hasOwn(publicResult.requests[0], 'requesterName'), false)
  assert.equal(Object.hasOwn(publicResult.requests[0], 'requestNotes'), false)
  assert.equal(publicResult.requests[0].contactPhone, '')
  await bloodRequestService.reportPublicBloodRequest(stored._id.toString(), userId.toString(), { reason: 'Wrong contact information' })
  assert.equal(auditEntries[0].actorRole, 'PATIENT')
  assert.equal(auditEntries[1].actorRole, 'PATIENT')
  await assert.rejects(
    bloodRequestService.reportPublicBloodRequest(stored._id.toString(), userId.toString(), { reason: 'Still incorrect' }),
    { statusCode: 409 },
  )
})

test('patient blood-request audit events pass audit-log schema validation', () => {
  const auditEntry = new AdminAuditLog({
    actorId: new mongoose.Types.ObjectId(),
    actorRole: 'PATIENT',
    action: 'BLOOD_REQUEST_CREATED',
    entityType: 'BloodRequest',
    entityId: new mongoose.Types.ObjectId(),
  })

  assert.equal(auditEntry.validateSync(), undefined)
})

test('public blood requests expose contact only after explicit consent and verification', async () => {
  const userId = new mongoose.Types.ObjectId()
  users.set(userId.toString(), { name: 'Account Holder', accountStatus: 'ACTIVE' })
  const created = await bloodRequestService.createBloodRequest(userId.toString(), {
    bloodGroup: 'A+',
    quantity: 1,
    hospitalName: 'North Clinic',
    contactPhoneConsent: true,
    contactPerson: 'Caregiver',
    contactPhone: '+8801712345678',
    requiredAt: new Date().toISOString(),
  })
  const stored = requests.find((request) => request._id.toString() === created.id)

  assert.equal(stored.contactPhone, '+8801712345678')
  stored.status = 'ACTIVE'
  stored.verificationStatus = 'VERIFIED'
  const publicRequest = await bloodRequestService.getPublicBloodRequestById(stored._id.toString())
  assert.equal(publicRequest.contactPerson, 'Caregiver')
  assert.equal(publicRequest.contactPhone, '+8801712345678')
  await assert.rejects(
    bloodRequestService.createBloodRequest(userId.toString(), { ...{
      bloodGroup: 'O+',
      quantity: 1,
      hospitalName: 'Clinic',
    }, requesterId: userId.toString() }),
    { statusCode: 400 },
  )
})

test('pending requests are not publicly addressable and inactive accounts cannot submit', async () => {
  const userId = new mongoose.Types.ObjectId()
  users.set(userId.toString(), { name: 'Suspended Account', accountStatus: 'SUSPENDED' })
  await assert.rejects(
    bloodRequestService.createBloodRequest(userId.toString(), {
      bloodGroup: 'B+',
      quantity: 1,
      hospitalName: 'Clinic',
    }),
    { statusCode: 403 },
  )
  const pendingId = requests.find((request) => request.status === 'PENDING')?._id.toString()
  if (pendingId) {
    await assert.rejects(bloodRequestService.getPublicBloodRequestById(pendingId), { statusCode: 404 })
  }
  await assert.rejects(bloodRequestService.getPublicBloodRequests({ status: 'PENDING' }), { statusCode: 400 })
})

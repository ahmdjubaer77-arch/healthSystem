const { test } = require('node:test')
const assert = require('node:assert/strict')
const User = require('../src/models/User')
const Provider = require('../src/models/Provider')
const BloodRequest = require('../src/models/BloodRequest')
const EmergencyRequest = require('../src/models/EmergencyRequest')
const Complaint = require('../src/models/Complaint')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const analyticsService = require('../src/services/admin.analytics.service')

function isRangeQuery(query) {
  return Boolean(query.createdAt?.$gte && query.createdAt?.$lte)
}

User.countDocuments = async (query = {}) => {
  if (query.role === 'BLOOD_DONOR') return 18
  if (query.accountStatus === 'ACTIVE') return 100
  if (isRangeQuery(query)) return 5
  return 120
}

Provider.countDocuments = async (query = {}) => {
  if (query.providerType === 'Doctor') return 11
  if (query.providerType === 'Hospital') return 7
  if (query.providerType === 'Pharmacy') return 9
  if (query.providerType === 'Ambulance Provider') return 4
  return { PENDING: 3, VERIFIED: 20, REJECTED: 2, SUSPENDED: 1 }[query.verificationStatus] || 0
}

BloodRequest.countDocuments = async (query = {}) => {
  if (query.status === 'ACTIVE') return 3
  if (query.status === 'FULFILLED') return 2
  return 7
}

EmergencyRequest.countDocuments = async (query = {}) => {
  if (query.status === 'RESOLVED') return 1
  if (query.status?.$in) return 2
  return 4
}

Complaint.countDocuments = async (query = {}) => {
  if (query.status === 'RESOLVED') return 3
  if (query.status?.$in) return 5
  return 9
}

AdminAuditLog.countDocuments = async (query = {}) => {
  if (query.$or?.some((condition) => condition.action?.$regex?.test?.('hospital.search'))) return 2
  return 1
}

test('analytics aggregates real domain counts by range without exposing personal records', async () => {
  const result = await analyticsService.getAnalytics('overview', '7d')
  assert.equal(result.users.totalUsers, 120)
  assert.equal(result.users.activeUsers, 100)
  assert.equal(result.users.newUsersInRange, 5)
  assert.deepEqual(
    [result.providers.doctors, result.providers.hospitals, result.providers.pharmacies, result.providers.ambulances],
    [11, 7, 9, 4],
  )
  assert.deepEqual(result.services.blood, {
    bloodDonors: 18,
    bloodRequests: 7,
    activeRequests: 3,
    fulfilledRequests: 2,
  })
  assert.deepEqual(result.services.emergency, { totalRequests: 4, activeRequests: 2, resolvedRequests: 1 })
  assert.deepEqual(result.services.complaints, { total: 9, open: 5, resolved: 3 })
  assert.equal(result.services.hospitalSearches, 2)
  assert.equal(result.services.successfulDonorConnections, 1)
  assert.equal(Object.hasOwn(result.services, 'medicines'), false)
  assert.equal(Object.hasOwn(result, 'usersList'), false)
  assert.equal(JSON.stringify(result).includes('email'), false)
  await assert.rejects(analyticsService.getAnalytics('overview', 'all-time'), { statusCode: 400 })
})
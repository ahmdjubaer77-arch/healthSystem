const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const User = require('../src/models/User')
const BloodRequest = require('../src/models/BloodRequest')
const EmergencyRequest = require('../src/models/EmergencyRequest')
const Complaint = require('../src/models/Complaint')
const adminService = require('../src/services/admin.service')

const models = [User, BloodRequest, EmergencyRequest, Complaint]
const originalAggregates = models.map((model) => model.aggregate)

test('dashboard activity returns a complete seven-day UTC series from real request counts', async () => {
  const now = new Date('2026-11-05T12:00:00.000Z')
  const aggregateResults = new Map([
    [User, [{ _id: '2026-11-05', count: 4 }]],
    [BloodRequest, [{ _id: '2026-11-04', count: 2 }]],
    [EmergencyRequest, []],
    [Complaint, [{ _id: '2026-10-30', count: 1 }]],
  ])
  for (const model of models) {
    model.aggregate = async (pipeline) => {
      assert.equal(pipeline[0].$match.createdAt.$gte.toISOString(), '2026-10-30T00:00:00.000Z')
      assert.equal(pipeline[0].$match.createdAt.$lte.toISOString(), '2026-11-05T23:59:59.999Z')
      return aggregateResults.get(model)
    }
  }

  const activity = await adminService.getDashboardActivity(now)

  assert.equal(activity.length, 7)
  assert.deepEqual(activity[0], {
    date: '2026-10-30',
    users: 0,
    bloodRequests: 0,
    emergencyRequests: 0,
    complaints: 1,
  })
  assert.deepEqual(activity[5], {
    date: '2026-11-04',
    users: 0,
    bloodRequests: 2,
    emergencyRequests: 0,
    complaints: 0,
  })
  assert.deepEqual(activity[6], {
    date: '2026-11-05',
    users: 4,
    bloodRequests: 0,
    emergencyRequests: 0,
    complaints: 0,
  })
})

after(() => {
  models.forEach((model, index) => {
    model.aggregate = originalAggregates[index]
  })
})

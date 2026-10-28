const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../src/models/User')
const HealthProfile = require('../src/models/HealthProfile')
const MedicalTimeline = require('../src/models/MedicalTimeline')
const MedicalDocument = require('../src/models/MedicalDocument')
const HealthShare = require('../src/models/HealthShare')
const BloodRequest = require('../src/models/BloodRequest')
const EmergencyRequest = require('../src/models/EmergencyRequest')
const Complaint = require('../src/models/Complaint')
const userService = require('../src/services/user.service')
const userRoutes = require('../src/routes/user.routes')
const aiRoutes = require('../src/routes/ai.routes')
const userController = require('../src/controllers/user.controller')
const { authenticate } = require('../src/middleware/auth.middleware')
const app = require('../src/app')

const originalMethods = {
  userFindById: User.findById,
  healthDeleteOne: HealthProfile.deleteOne,
  timelineDeleteMany: MedicalTimeline.deleteMany,
  documentFind: MedicalDocument.find,
  documentDeleteMany: MedicalDocument.deleteMany,
  shareFind: HealthShare.find,
  bloodDeleteMany: BloodRequest.deleteMany,
  bloodUpdateMany: BloodRequest.updateMany,
  emergencyDeleteMany: EmergencyRequest.deleteMany,
  emergencyUpdateMany: EmergencyRequest.updateMany,
  complaintDeleteMany: Complaint.deleteMany,
  complaintUpdateMany: Complaint.updateMany,
}

after(() => {
  User.findById = originalMethods.userFindById
  HealthProfile.deleteOne = originalMethods.healthDeleteOne
  MedicalTimeline.deleteMany = originalMethods.timelineDeleteMany
  MedicalDocument.find = originalMethods.documentFind
  MedicalDocument.deleteMany = originalMethods.documentDeleteMany
  BloodRequest.deleteMany = originalMethods.bloodDeleteMany
  BloodRequest.updateMany = originalMethods.bloodUpdateMany
  EmergencyRequest.deleteMany = originalMethods.emergencyDeleteMany
  EmergencyRequest.updateMany = originalMethods.emergencyUpdateMany
  Complaint.deleteMany = originalMethods.complaintDeleteMany
  Complaint.updateMany = originalMethods.complaintUpdateMany
  HealthShare.find = originalMethods.shareFind
})

test('profile update persists edited values and clears optional fields on the authenticated user', async () => {
  const updatedUser = {
    _id: { toString: () => 'user-123' },
    name: 'Updated Patient',
    phone: '555123',
    gender: 'FEMALE',
    dateOfBirth: new Date('1995-02-03T00:00:00.000Z'),
    location: { division: 'Dhaka', district: '', upazila: 'Uttara', area: '' },
    bloodGroup: null,
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    async save() {},
    set(field, value) { this[field] = value },
  }
  let queriedUserId
  User.findById = (id) => {
    queriedUserId = id
    return { select: async () => updatedUser }
  }

  const result = await userService.updateMyProfile('user-123', {
    name: ' Updated Patient ',
    phone: '555123',
    dateOfBirth: '1995-02-03',
    gender: 'female',
    location: { division: 'Dhaka', district: '', upazila: 'Uttara', area: '' },
    bloodGroup: null,
  })

  assert.equal(queriedUserId, 'user-123')
  assert.equal(result.name, 'Updated Patient')
  assert.equal(result.phone, '555123')
  assert.equal(result.gender, 'FEMALE')
  assert.equal(result.dateOfBirth.toISOString(), '1995-02-03T00:00:00.000Z')
  assert.deepEqual(result.location, { division: 'Dhaka', district: '', upazila: 'Uttara', area: '' })
  assert.equal(result.bloodGroup, null)

  const clearedProfile = await userService.updateMyProfile('user-123', {
    phone: null,
    dateOfBirth: null,
    gender: null,
    location: null,
    bloodGroup: null,
  })
  const refreshedProfile = await userService.getMyProfile('user-123')
  assert.equal(clearedProfile.phone, null)
  assert.equal(clearedProfile.dateOfBirth, null)
  assert.equal(clearedProfile.gender, null)
  assert.equal(clearedProfile.location, null)
  assert.equal(clearedProfile.bloodGroup, null)
  assert.equal(refreshedProfile.phone, null)
  assert.equal(refreshedProfile.dateOfBirth, null)
  assert.equal(refreshedProfile.gender, null)
  assert.equal(refreshedProfile.location, null)
  assert.equal(refreshedProfile.bloodGroup, null)
  await assert.rejects(
    userService.updateMyProfile('user-123', { userId: 'another-user', name: 'Attempted change' }),
    (error) => error.statusCode === 400,
  )
})

test('account deletion rejects an incorrect current password without deleting user data', async () => {
  const passwordHash = await bcrypt.hash('correct-password', 4)
  let deleted = false
  User.findById = () => ({
    select: async () => ({
      passwordHash,
      async deleteOne() { deleted = true },
    }),
  })

  await assert.rejects(
    userService.deleteMyAccount('user-123', { currentPassword: 'wrong-password' }),
    (error) => error.statusCode === 401,
  )
  assert.equal(deleted, false)
})

test('password change requires the current password and stores a bcrypt hash of the new password', async () => {
  const passwordHash = await bcrypt.hash('current-password', 4)
  let saved = false
  const user = {
    passwordHash,
    async save() { saved = true },
  }
  User.findById = () => ({
    select: async () => user,
  })

  await assert.rejects(
    userService.changeMyPassword('user-password', {
      currentPassword: 'wrong-password',
      newPassword: 'a-new-secure-password',
      confirmPassword: 'a-new-secure-password',
    }),
    (error) => error.statusCode === 401,
  )
  assert.equal(saved, false)

  await userService.changeMyPassword('user-password', {
    currentPassword: 'current-password',
    newPassword: 'a-new-secure-password',
    confirmPassword: 'a-new-secure-password',
  })
  assert.equal(saved, true)
  assert.notEqual(user.passwordHash, passwordHash)
  assert.equal(await bcrypt.compare('a-new-secure-password', user.passwordHash), true)
})

test('account deletion removes only records owned or assigned to the authenticated user after password verification', async () => {
  const userId = 'user-456'
  const passwordHash = await bcrypt.hash('correct-password', 4)
  const deletedFilters = []
  const updatedFilters = []
  let deletedUserId
  const noOp = async (filter) => { deletedFilters.push(filter) }

  User.findById = (id) => ({
    select: async () => ({
      passwordHash,
      async deleteOne() { deletedUserId = id },
    }),
  })
  MedicalDocument.find = async () => []
  HealthShare.find = async () => []
  HealthProfile.deleteOne = noOp
  MedicalTimeline.deleteMany = noOp
  MedicalDocument.deleteMany = noOp
  BloodRequest.deleteMany = noOp
  BloodRequest.updateMany = async (filter) => { updatedFilters.push(filter) }
  EmergencyRequest.deleteMany = noOp
  EmergencyRequest.updateMany = async (filter) => { updatedFilters.push(filter) }
  Complaint.deleteMany = noOp
  Complaint.updateMany = async (filter) => { updatedFilters.push(filter) }

  const result = await userService.deleteMyAccount(userId, { currentPassword: 'correct-password' })

  assert.deepEqual(result, { deleted: true })
  assert.equal(deletedUserId, userId)
  assert.ok(deletedFilters.length >= 6)
  assert.ok(updatedFilters.length >= 3)
  assert.ok(deletedFilters.every((filter) => Object.values(filter).every((value) => value === userId)))
})

test('profile routes require authentication and always update the authenticated user', async () => {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'user-profile-route-test-secret'
  const expectedUserId = 'token-owned-user'
  const accountSecurityRoutes = [
    ['/me/change-password', 'post'],
    ['/me/email-change/request', 'post'],
    ['/me/email-change/confirm', 'post'],
  ]
  for (const [path, method] of accountSecurityRoutes) {
    const route = userRoutes.stack
      .find((layer) => layer.route?.path === path && layer.route.methods[method])
      .route
    assert.equal(route.stack[0].handle, authenticate)
  }

  const patchRoute = userRoutes.stack
    .find((layer) => layer.route?.path === '/me' && layer.route.methods.patch)
    .route
  const deleteRoute = userRoutes.stack
    .find((layer) => layer.route?.path === '/me' && layer.route.methods.delete)
    .route
  assert.equal(patchRoute.stack[0].handle, authenticate)
  assert.equal(deleteRoute.stack[0].handle, authenticate)

  let unauthenticatedError
  authenticate({ get: () => '' }, {}, (error) => { unauthenticatedError = error })
  assert.equal(unauthenticatedError.statusCode, 401)

  const token = jwt.sign({ userId: expectedUserId, role: 'PATIENT' }, process.env.JWT_SECRET)
  let authenticatedUser
  const authenticatedRequest = { get: () => `Bearer ${token}` }
  authenticate(authenticatedRequest, {}, (error) => { assert.ifError(error) })
  authenticatedUser = authenticatedRequest.user
  assert.equal(authenticatedUser.userId, expectedUserId)

  const originalUpdate = userService.updateMyProfile
  let updatedUserId
  try {
    userService.updateMyProfile = async (userId) => {
      updatedUserId = userId
      return { id: userId, name: 'Updated Owner' }
    }
    const response = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this },
      json(body) { this.body = body; return this },
    }
    await userController.updateMyProfile(
      { user: authenticatedUser, body: { name: 'Updated Owner' } },
      response,
      (error) => { throw error },
    )
    assert.equal(response.statusCode, 200)
    assert.equal(updatedUserId, expectedUserId)
    assert.equal(response.body.data.user.name, 'Updated Owner')
  } finally {
    userService.updateMyProfile = originalUpdate
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  }
})

test('application mounts user routes under the users API prefix before generic API routers', () => {
  const layers = app._router.stack
  const userRoutesIndex = layers.findIndex((layer) => layer.handle === userRoutes)
  const aiRoutesIndex = layers.findIndex((layer) => layer.handle === aiRoutes)
  assert.notEqual(userRoutesIndex, -1)
  assert.notEqual(aiRoutesIndex, -1)
  assert.ok(userRoutesIndex < aiRoutesIndex)
  assert.ok(layers[userRoutesIndex].regexp.test('/api/users/me/email-change/request'))
})

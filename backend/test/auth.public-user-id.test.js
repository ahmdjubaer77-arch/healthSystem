const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcrypt')
const User = require('../src/models/User')
const otpService = require('../src/services/otp.service')
const authService = require('../src/services/auth.service')
const { PUBLIC_USER_ID_PATTERN } = require('../src/utils/public-user-id')

const originalExists = User.exists
const originalCreate = User.create
const originalHash = bcrypt.hash
const originalRequestEmailVerification = otpService.requestEmailVerification

after(() => {
  User.exists = originalExists
  User.create = originalCreate
  bcrypt.hash = originalHash
  otpService.requestEmailVerification = originalRequestEmailVerification
})

test('registration persists and returns its server-generated public ID', async () => {
  User.exists = async () => null
  bcrypt.hash = async () => 'hashed-password'
  otpService.requestEmailVerification = async () => {}
  let createdUser
  User.create = async (input) => {
    createdUser = {
      ...input,
      _id: { toString: () => 'internal-mongo-id' },
    }
    return createdUser
  }

  const result = await authService.register({
    name: 'Registration Test',
    email: 'registration@example.test',
    password: 'secure-password',
    publicUserId: 'BDH-AAAAAAAA',
  })

  assert.match(createdUser.publicUserId, PUBLIC_USER_ID_PATTERN)
  assert.notEqual(createdUser.publicUserId, 'BDH-AAAAAAAA')
  assert.equal(result.publicUserId, createdUser.publicUserId)
  assert.notEqual(result.publicUserId, result.id)
  assert.equal(createdUser.emailVerified, false)
  assert.equal(createdUser.emailVerificationRequired, true)
})

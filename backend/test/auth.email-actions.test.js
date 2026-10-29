const { test } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcrypt')
const EmailActionToken = require('../src/models/EmailActionToken')
const User = require('../src/models/User')
const emailActionService = require('../src/services/email-action.service')

test('email verification validates a six-digit OTP and marks the account verified', async () => {
  const originalFindOne = EmailActionToken.findOne
  const originalDeleteOne = EmailActionToken.deleteOne
  const originalFindById = User.findById
  const originalCompare = bcrypt.compare
  const user = {
    email: 'person@example.test',
    emailVerified: false,
    emailVerificationRequired: true,
    async save() {},
  }
  const otp = {
    _id: 'otp-id',
    userId: 'user-id',
    targetEmail: user.email,
    tokenHash: 'stored-hash',
    attempts: 0,
  }
  let query

  try {
    EmailActionToken.findOne = (filter) => {
      query = filter
      return { sort: async () => otp }
    }
    EmailActionToken.deleteOne = async () => ({ deletedCount: 1 })
    User.findById = async () => user
    bcrypt.compare = async (code, hash) => code === '123456' && hash === otp.tokenHash

    const result = await emailActionService.verifyEmail({
      email: user.email,
      code: '123456',
      purpose: 'EMAIL_VERIFICATION',
    })

    assert.deepEqual(result, { verified: true, changed: false })
    assert.equal(query.purpose, 'EMAIL_VERIFICATION')
    assert.equal(query.targetEmail, user.email)
    assert.equal(user.emailVerified, true)
    assert.equal(user.emailVerificationRequired, false)
  } finally {
    EmailActionToken.findOne = originalFindOne
    EmailActionToken.deleteOne = originalDeleteOne
    User.findById = originalFindById
    bcrypt.compare = originalCompare
  }
})

test('password reset verifies OTP and hashes the new password before saving', async () => {
  const originalFindOne = EmailActionToken.findOne
  const originalDeleteOne = EmailActionToken.deleteOne
  const originalFindById = User.findById
  const originalHash = bcrypt.hash
  const originalCompare = bcrypt.compare
  const originalDeleteMany = EmailActionToken.deleteMany
  const user = {
    email: 'person@example.test',
    passwordHash: 'old-hash',
    async save() {},
  }
  const otp = {
    _id: 'otp-id',
    userId: 'user-id',
    targetEmail: user.email,
    tokenHash: 'stored-hash',
    attempts: 0,
  }
  let otpQuery

  try {
    EmailActionToken.findOne = (query) => {
      otpQuery = query
      return { sort: async () => otp }
    }
    EmailActionToken.deleteOne = async () => ({ deletedCount: 1 })
    User.findById = () => ({ select: async () => user })
    bcrypt.hash = async (password, rounds) => `${rounds}:${password}`
    bcrypt.compare = async (code) => code === '654321'
    EmailActionToken.deleteMany = async () => {}

    await emailActionService.resetPassword({
      email: user.email,
      code: '654321',
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    })

    assert.equal(otpQuery.purpose, 'PASSWORD_RESET')
    assert.equal(user.passwordHash, '12:a-secure-password')
  } finally {
    EmailActionToken.findOne = originalFindOne
    EmailActionToken.deleteOne = originalDeleteOne
    User.findById = originalFindById
    bcrypt.hash = originalHash
    bcrypt.compare = originalCompare
    EmailActionToken.deleteMany = originalDeleteMany
  }
})

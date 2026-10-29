const { test } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcrypt')
const User = require('../src/models/User')
const authService = require('../src/services/auth.service')

test('requires verification for new accounts while preserving legacy account login', async () => {
  const originalFindOne = User.findOne
  const originalCompare = bcrypt.compare
  const originalJwtSecret = process.env.JWT_SECRET
  const user = {
    _id: { toString: () => 'verified-user-id' },
    publicUserId: 'BDH-23456789',
    name: 'Unverified Test User',
    email: 'unverified-user@example.test',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    donorStandalone: false,
    emailVerified: false,
    emailVerificationRequired: true,
    passwordHash: 'stored-hash',
    async save() {},
  }

  try {
    process.env.JWT_SECRET = 'test-secret-for-email-verification'
    User.findOne = () => ({ select: async () => user })
    bcrypt.compare = async () => true

    await assert.rejects(
      authService.login({ email: user.email, password: 'valid-password' }),
      (error) => error.statusCode === 403 && error.code === 'EMAIL_NOT_VERIFIED',
    )

    user.emailVerificationRequired = false
    const legacyLogin = await authService.login({ email: user.email, password: 'valid-password' })
    assert.ok(legacyLogin.accessToken)
    assert.equal(legacyLogin.user.email, user.email)

    user.emailVerificationRequired = true
    user.emailVerified = true
    const verifiedLogin = await authService.login({ email: user.email, password: 'valid-password' })
    assert.ok(verifiedLogin.accessToken)
  } finally {
    User.findOne = originalFindOne
    bcrypt.compare = originalCompare
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalJwtSecret
  }
})

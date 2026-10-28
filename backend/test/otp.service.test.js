const { test } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcrypt')
const { createOtpService } = require('../src/services/otp.service')
const authRoutes = require('../src/routes/auth.routes')

const originalJwtSecret = process.env.JWT_SECRET
const originalGmailUser = process.env.GMAIL_USER
const originalGmailPassword = process.env.GMAIL_APP_PASSWORD

function createMemoryModels() {
  const users = new Map()
  const challenges = new Map()
  let nextId = 1

  const matches = (document, filter) => Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return condition.some((alternative) => matches(document, alternative))
    const value = document[key]
    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      return Object.entries(condition).every(([operator, expected]) => {
        if (operator === '$exists') return expected ? value !== undefined : value === undefined
        if (operator === '$lte') return value != null && new Date(value).getTime() <= new Date(expected).getTime()
        if (operator === '$lt') return value != null && Number(value) < Number(expected)
        if (operator === '$gt') return value != null && new Date(value).getTime() > new Date(expected).getTime()
        return false
      })
    }
    if (condition === null) return value == null
    return value === condition
  })

  const UserModel = {
    async findOne(filter) {
      return [...users.values()].find((user) => matches(user, filter)) || null
    },
    findById(id) {
      const user = users.get(id)
      return { select: async () => user || null }
    },
    async exists(filter) {
      return [...users.values()].some((user) => matches(user, filter)) ? { _id: 'existing' } : null
    },
    async updateOne(filter, update) {
      const user = [...users.values()].find((candidate) => matches(candidate, filter))
      if (!user) return { matchedCount: 0 }
      Object.assign(user, update.$set)
      return { matchedCount: 1 }
    },
    async findOneAndUpdate(filter, update) {
      const user = [...users.values()].find((candidate) => matches(candidate, filter))
      if (!user) return null
      Object.assign(user, update.$set)
      return user
    },
  }

  const CodeModel = {
    async findOne(filter) {
      return [...challenges.values()].find((challenge) => matches(challenge, filter)) || null
    },
    async findOneAndUpdate(filter, update) {
      const challenge = [...challenges.values()].find((candidate) => matches(candidate, filter))
      if (!challenge) return null
      Object.assign(challenge, update.$set)
      return challenge
    },
    async create(input) {
      const existing = [...challenges.values()].some(
        (challenge) => challenge.email === input.email && challenge.purpose === input.purpose,
      )
      if (existing) {
        const error = new Error('Duplicate challenge')
        error.code = 11000
        throw error
      }
      const challenge = { ...input, _id: `challenge-${nextId++}`, usedAt: null, resetTokenHash: null }
      challenges.set(challenge._id, challenge)
      return challenge
    },
    async updateOne(filter, update) {
      const challenge = [...challenges.values()].find((candidate) => matches(candidate, filter))
      if (!challenge) return { matchedCount: 0 }
      for (const [key, increment] of Object.entries(update.$inc || {})) {
        challenge[key] = (challenge[key] || 0) + increment
      }
      return { matchedCount: 1 }
    },
  }

  return { UserModel, CodeModel, users, challenges }
}

function createTestOtpService({ startTime = Date.parse('2026-01-01T00:00:00.000Z') } = {}) {
  process.env.JWT_SECRET = 'test-otp-secret'
  let currentTime = startTime
  const sentEmails = []
  const models = createMemoryModels()
  const service = createOtpService({
    ...models,
    now: () => currentTime,
    randomInt: () => 123456,
    createTransport: (options) => ({
      sendMail: async (mail) => {
        assert.equal(options.service, 'gmail')
        sentEmails.push(mail)
      },
    }),
  })
  process.env.GMAIL_USER = 'otp-sender@example.test'
  process.env.GMAIL_APP_PASSWORD = 'test-app-password'
  return {
    ...models,
    service,
    sentEmails,
    setTime(value) { currentTime = value },
    getTime() { return currentTime },
  }
}

test('registration verification stores a purpose-bound hash and consumes the OTP once', async () => {
  const context = createTestOtpService()
  context.users.set('user-1', {
    email: 'new.user@example.test',
    name: '<New User>',
    emailVerificationRequired: true,
    emailVerified: false,
    accountStatus: 'ACTIVE',
  })

  await context.service.requestEmailVerification(' NEW.USER@example.test ')
  const challenge = [...context.challenges.values()][0]
  assert.equal(challenge.purpose, 'EMAIL_VERIFICATION')
  assert.notEqual(challenge.otpHash, '123456')
  assert.equal(challenge.otpExpiresAt.getTime() - context.getTime(), 5 * 60 * 1000)
  assert.match(context.sentEmails[0].html, /NIROGIX X/)
  assert.match(context.sentEmails[0].html, /If you did not request this code/)
  assert.match(context.sentEmails[0].html, /&lt;New User&gt;/)
  assert.match(context.sentEmails[0].html, /background-color:#f3f6f8/)
  assert.equal((context.sentEmails[0].html.match(/width="16\.66%"/g) || []).length, 6)
  assert.doesNotMatch(context.sentEmails[0].html, /background:#071827/)

  await assert.rejects(
    context.service.verifyEmail({ email: 'new.user@example.test', code: '000000' }),
    (error) => error.code === 'OTP_INVALID',
  )
  assert.equal(challenge.attempts, 1)

  await context.service.verifyEmail({ email: 'new.user@example.test', code: '123456' })
  assert.equal(context.users.get('user-1').emailVerified, true)
  assert.equal(context.users.get('user-1').emailVerificationRequired, false)
  await assert.rejects(
    context.service.verifyEmail({ email: 'new.user@example.test', code: '123456' }),
    (error) => error.code === 'OTP_EXPIRED',
  )
})

test('OTP verification enforces the five-attempt limit, expiration, and resend cooldown', async () => {
  const context = createTestOtpService()
  context.users.set('user-2', {
    email: 'verify@example.test',
    name: 'Verify User',
    emailVerificationRequired: true,
    emailVerified: false,
    accountStatus: 'ACTIVE',
  })

  await context.service.requestEmailVerification('verify@example.test')
  await assert.rejects(
    context.service.requestEmailVerification('verify@example.test'),
    (error) => error.code === 'OTP_RESEND_COOLDOWN',
  )

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(
      context.service.verifyEmail({ email: 'verify@example.test', code: '000000' }),
      (error) => error.code === 'OTP_INVALID',
    )
  }
  await assert.rejects(
    context.service.verifyEmail({ email: 'verify@example.test', code: '123456' }),
    (error) => error.code === 'OTP_ATTEMPTS_EXCEEDED',
  )

  context.setTime(context.getTime() + 60 * 1000 + 1)
  await context.service.requestEmailVerification('verify@example.test')
  const challenge = [...context.challenges.values()][0]
  assert.equal(challenge.attempts, 0)
  context.setTime(context.getTime() + 5 * 60 * 1000 + 1)
  await assert.rejects(
    context.service.verifyEmail({ email: 'verify@example.test', code: '123456' }),
    (error) => error.code === 'OTP_EXPIRED',
  )
})

test('password reset verifies a reset-purpose OTP and consumes short-lived reset authorization', async () => {
  const context = createTestOtpService()
  const user = {
    email: 'reset@example.test',
    name: 'Reset User',
    emailVerificationRequired: false,
    emailVerified: true,
    accountStatus: 'ACTIVE',
    passwordHash: 'old-password-hash',
  }
  context.users.set('user-3', user)

  await context.service.requestPasswordReset('reset@example.test')
  const challenge = [...context.challenges.values()][0]
  assert.equal(challenge.purpose, 'PASSWORD_RESET')
  const authorization = await context.service.confirmPasswordReset({
    email: 'reset@example.test',
    code: '123456',
  })
  assert.equal(typeof authorization.resetToken, 'string')
  assert.notEqual(challenge.resetTokenHash, authorization.resetToken)
  assert.equal(authorization.expiresIn, 300)

  await context.service.resetPassword({
    email: 'reset@example.test',
    resetToken: authorization.resetToken,
    password: 'a-new-secure-password',
    confirmPassword: 'a-new-secure-password',
  })
  assert.notEqual(user.passwordHash, 'old-password-hash')
  assert.equal(await bcrypt.compare('a-new-secure-password', user.passwordHash), true)
  await assert.rejects(
    context.service.resetPassword({
      email: 'reset@example.test',
      resetToken: authorization.resetToken,
      password: 'another-secure-password',
      confirmPassword: 'another-secure-password',
    }),
    (error) => error.code === 'RESET_AUTH_INVALID',
  )
  await assert.rejects(
    context.service.confirmPasswordReset({ email: 'reset@example.test', code: '123456' }),
    (error) => error.code === 'OTP_INVALID',
  )
})

test('authenticated email change sends to the new address and updates only after purpose-bound OTP verification', async () => {
  const context = createTestOtpService()
  context.users.set('user-4', {
    _id: 'user-4',
    email: 'old@example.test',
    name: 'Email Change User',
    emailVerificationRequired: false,
    emailVerified: true,
    accountStatus: 'ACTIVE',
  })

  const request = await context.service.requestEmailChange('user-4', 'New@example.test')
  const challenge = [...context.challenges.values()][0]
  assert.equal(request.email, 'new@example.test')
  assert.equal(challenge.purpose, 'EMAIL_CHANGE')
  assert.equal(challenge.pendingEmail, 'new@example.test')
  assert.equal(context.sentEmails[0].to, 'new@example.test')
  assert.match(context.sentEmails[0].subject, /new .* email/i)

  await assert.rejects(
    context.service.confirmEmailChange('user-4', '000000'),
    (error) => error.code === 'OTP_INVALID',
  )
  const result = await context.service.confirmEmailChange('user-4', '123456')
  assert.equal(result.email, 'new@example.test')
  assert.equal(context.users.get('user-4').emailVerified, true)
  assert.equal(challenge.otpHash, null)
  await assert.rejects(
    context.service.confirmEmailChange('user-4', '123456'),
    (error) => error.code === 'EMAIL_CHANGE_NOT_PENDING',
  )
})

test('rejects email changes to an address already used by another account', async () => {
  const context = createTestOtpService()
  context.users.set('user-5', {
    _id: 'user-5',
    email: 'current@example.test',
    name: 'Current User',
    accountStatus: 'ACTIVE',
  })
  context.users.set('user-6', {
    _id: 'user-6',
    email: 'taken@example.test',
    name: 'Existing User',
    accountStatus: 'ACTIVE',
  })

  await assert.rejects(
    context.service.requestEmailChange('user-5', 'taken@example.test'),
    (error) => error.statusCode === 409 && error.code === 'EMAIL_IN_USE',
  )
})

test('auth routes expose the email verification and password reset endpoints', () => {
  const registeredPaths = authRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path)

  assert.ok(registeredPaths.includes('/email/verification/request'))
  assert.ok(registeredPaths.includes('/email/verification/confirm'))
  assert.ok(registeredPaths.includes('/password/reset/request'))
  assert.ok(registeredPaths.includes('/password/reset/verify'))
  assert.ok(registeredPaths.includes('/password/reset/confirm'))
})

test.after(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = originalJwtSecret
  if (originalGmailUser === undefined) delete process.env.GMAIL_USER
  else process.env.GMAIL_USER = originalGmailUser
  if (originalGmailPassword === undefined) delete process.env.GMAIL_APP_PASSWORD
  else process.env.GMAIL_APP_PASSWORD = originalGmailPassword
})

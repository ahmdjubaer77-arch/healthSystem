const { test } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const { authenticate } = require('../src/middleware/auth.middleware')

const userId = '65a000000000000000000001'
const originalSecret = process.env.JWT_SECRET
process.env.JWT_SECRET = 'test-secret-for-auth-middleware'

function authenticateRequest(authorization) {
  const req = {
    get: (name) => name === 'authorization' ? authorization : undefined,
  }
  let nextError
  authenticate(req, {}, (error) => {
    nextError = error
  })
  return { req, error: nextError }
}

test('accepts a valid bearer JWT and derives the authenticated identity', () => {
  const token = jwt.sign({ userId, role: 'PATIENT' }, process.env.JWT_SECRET, { expiresIn: '5m' })
  const { req, error } = authenticateRequest(`Bearer ${token}`)

  assert.equal(error, undefined)
  assert.deepEqual(req.user, { userId, role: 'PATIENT' })
})

test('rejects requests without bearer credentials', () => {
  const { error } = authenticateRequest(undefined)
  assert.equal(error.statusCode, 401)
  assert.equal(error.code, 'AUTH_REQUIRED')
})

test('identifies expired sessions without weakening authentication', () => {
  const token = jwt.sign({ userId, role: 'PATIENT' }, process.env.JWT_SECRET, { expiresIn: '-1s' })
  const { error } = authenticateRequest(`Bearer ${token}`)

  assert.equal(error.statusCode, 401)
  assert.equal(error.code, 'SESSION_EXPIRED')
  assert.match(error.message, /session has expired/i)
})

test('rejects malformed or invalid bearer credentials', () => {
  const { error } = authenticateRequest('Bearer invalid-token')
  assert.equal(error.statusCode, 401)
  assert.equal(error.code, 'AUTH_REQUIRED')
})

test.after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = originalSecret
})

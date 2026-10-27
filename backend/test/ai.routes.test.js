const { after, before, test } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const aiRoutes = require('../src/routes/ai.routes')
const { authenticate } = require('../src/middleware/auth.middleware')

const originalSecret = process.env.JWT_SECRET
const aiRoute = aiRoutes.stack.find((layer) => layer.route?.path === '/ai/chat')?.route

before(() => {
  process.env.JWT_SECRET = 'test-secret-for-ai-route'
})

after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = originalSecret
})

async function runAuthenticationMiddleware(authorization) {
  const req = {
    get: (name) => name.toLowerCase() === 'authorization' ? authorization : undefined,
  }

  for (const layer of aiRoute.stack.slice(0, 2)) {
    const error = await new Promise((resolve) => {
      layer.handle(req, {}, resolve)
    })
    if (error) return { error, req }
  }

  return { error: undefined, req }
}

test('registers the AI endpoint behind trusted JWT authentication and patient-role authorization', async () => {
  assert.ok(aiRoute)
  assert.equal(aiRoute.methods.post, true)
  assert.equal(aiRoute.stack[0].handle, authenticate)
  assert.equal(aiRoute.stack[2].handle.name, 'userRateLimit')
  assert.equal(aiRoute.stack[3].handle.name, 'chat')

  const anonymous = await runAuthenticationMiddleware(undefined)
  assert.equal(anonymous.error.statusCode, 401)

  const adminToken = jwt.sign({ userId: 'admin-id', role: 'ADMIN' }, process.env.JWT_SECRET)
  const nonPatient = await runAuthenticationMiddleware(`Bearer ${adminToken}`)
  assert.equal(nonPatient.error.statusCode, 403)

  const patientToken = jwt.sign({ userId: 'patient-id', role: 'PATIENT' }, process.env.JWT_SECRET)
  const patient = await runAuthenticationMiddleware(`Bearer ${patientToken}`)
  assert.equal(patient.error, undefined)
  assert.deepEqual(patient.req.user, { userId: 'patient-id', role: 'PATIENT' })
})

const { test } = require('node:test')
const assert = require('node:assert/strict')

process.env.CLIENT_URL = 'https://health-system-iota.vercel.app'

const app = require('../src/app')
const notFoundMiddleware = require('../src/middleware/notFound.middleware')

function findMountedGetRoutes(path) {
  const childPath = path.replace(/^\/api/, '')
  return app._router.stack.filter((mount) => (
    mount.name === 'router'
    && mount.regexp.test(path)
    && mount.handle.stack.some((layer) => layer.route?.path === childPath && layer.route.methods.get)
  ))
}

function invokeCors(req) {
  const corsLayer = app._router.stack.find((layer) => layer.handle?.name === 'corsMiddleware')
  assert.ok(corsLayer, 'CORS middleware is registered')

  const headers = {}
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value },
    getHeader(name) { return headers[name.toLowerCase()] },
    end() { this.ended = true },
  }
  let nextCalled = false
  corsLayer.handle(req, res, () => { nextCalled = true })
  return { headers, res, nextCalled }
}

test('public frontend API endpoints are registered exactly once under /api', () => {
  for (const path of [
    '/api/doctors',
    '/api/hospitals',
    '/api/blood/donors',
    '/api/locations/options',
  ]) {
    assert.equal(findMountedGetRoutes(path).length, 1, `${path} should have one public GET route`)
  }
})

test('unknown routes keep the standard 404 response', () => {
  let statusCode
  let responseBody
  notFoundMiddleware({}, {
    status(code) {
      statusCode = code
      return this
    },
    json(body) {
      responseBody = body
      return this
    },
  })

  assert.equal(statusCode, 404)
  assert.deepEqual(responseBody, { success: false, message: 'Route not found', data: null })
})

test('OPTIONS preflight allows the configured production origin and requested API headers', () => {
  const result = invokeCors({
    method: 'OPTIONS',
    headers: {
      origin: 'https://health-system-iota.vercel.app',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization,content-type',
    },
  })

  assert.equal(result.res.statusCode, 204)
  assert.equal(result.res.ended, true)
  assert.equal(result.nextCalled, false)
  assert.equal(result.headers['access-control-allow-origin'], 'https://health-system-iota.vercel.app')
  assert.match(result.headers['access-control-allow-methods'], /GET/)
  assert.match(result.headers['access-control-allow-headers'], /Authorization/i)
})

test('CORS does not allow unrelated production origins', () => {
  const result = invokeCors({
    method: 'OPTIONS',
    headers: {
      origin: 'https://untrusted.example',
      'access-control-request-method': 'GET',
    },
  })

  assert.equal(result.headers['access-control-allow-origin'], undefined)
  assert.equal(result.nextCalled, true)
})

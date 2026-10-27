import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBearerHeaders } from '../src/utils/auth-headers.js'

test('sharing requests always use the authenticated bearer token', () => {
  const headers = createBearerHeaders('signed-in-session-token')
  assert.equal(headers.Authorization, 'Bearer signed-in-session-token')
})

test('caller headers cannot replace the authentication credential', () => {
  const headers = createBearerHeaders('signed-in-session-token', {
    Authorization: 'Bearer stale-or-overridden-token',
    'X-Request-ID': 'request-1',
  })

  assert.equal(headers.Authorization, 'Bearer signed-in-session-token')
  assert.equal(headers['X-Request-ID'], 'request-1')
})

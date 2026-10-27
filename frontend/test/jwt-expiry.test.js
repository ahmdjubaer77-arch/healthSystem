import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getJwtExpirationTime } from '../src/utils/jwt-expiry.js'

function makeToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${encoded}.signature`
}

test('reads the JWT expiration time in milliseconds', () => {
  assert.equal(getJwtExpirationTime(makeToken({ exp: 1_800_000_000 })), 1_800_000_000_000)
})

test('returns null when the token is missing an expiration or malformed', () => {
  assert.equal(getJwtExpirationTime(makeToken({ sub: 'user' })), null)
  assert.equal(getJwtExpirationTime('invalid-token'), null)
  assert.equal(getJwtExpirationTime(null), null)
})

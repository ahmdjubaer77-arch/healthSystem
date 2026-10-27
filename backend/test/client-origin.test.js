const { test } = require('node:test')
const assert = require('node:assert/strict')
const { isAllowedClientOrigin } = require('../src/utils/client-origin')

test('accepts the configured client origin exactly', () => {
  assert.equal(
    isAllowedClientOrigin('http://localhost:5173', 'http://localhost:5173', 'development'),
    true,
  )
})

test('accepts localhost aliases only in development when protocol and port match', () => {
  assert.equal(
    isAllowedClientOrigin('http://127.0.0.1:5173', 'http://localhost:5173', 'development'),
    true,
  )
  assert.equal(
    isAllowedClientOrigin('http://localhost:5174', 'http://127.0.0.1:5173', 'development'),
    false,
  )
  assert.equal(
    isAllowedClientOrigin('https://localhost:5173', 'http://127.0.0.1:5173', 'development'),
    false,
  )
})

test('never permits localhost aliases in production', () => {
  assert.equal(
    isAllowedClientOrigin('http://127.0.0.1:5173', 'http://localhost:5173', 'production'),
    false,
  )
})

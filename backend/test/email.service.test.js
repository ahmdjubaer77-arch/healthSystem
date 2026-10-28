const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const { createEmailService } = require('../src/services/email.service')

const originalApiKey = process.env.RESEND_API_KEY
const originalSender = process.env.EMAIL_FROM
const originalConsoleError = console.error

function restoreEnvironment(name, value) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

after(() => {
  restoreEnvironment('RESEND_API_KEY', originalApiKey)
  restoreEnvironment('EMAIL_FROM', originalSender)
  console.error = originalConsoleError
})

test('sends email using Resend HTTPS API and keeps credentials out of logs', async () => {
  process.env.RESEND_API_KEY = 'test_resend_secret'
  process.env.EMAIL_FROM = 'otp@example.test'
  let request
  const service = createEmailService({
    fetchImpl: async (url, options) => {
      request = { url, options }
      return { ok: true, status: 200 }
    },
  })

  await service.sendEmail({
    to: 'recipient@example.test',
    subject: 'Verification',
    text: 'Code content',
    html: '<p>Code content</p>',
  })

  assert.equal(request.url, 'https://api.resend.com/emails')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers.Authorization, 'Bearer test_resend_secret')
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'Nirogix X <otp@example.test>',
    to: ['recipient@example.test'],
    subject: 'Verification',
    text: 'Code content',
    html: '<p>Code content</p>',
  })
})

test('fails safely when the Resend API key or sender is missing', async (t) => {
  const service = createEmailService({ fetchImpl: async () => assert.fail('fetch should not be called') })
  process.env.EMAIL_FROM = 'otp@example.test'
  delete process.env.RESEND_API_KEY
  await assert.rejects(service.sendEmail({}), { code: 'EMAIL_PROVIDER_NOT_CONFIGURED', statusCode: 503 })

  process.env.RESEND_API_KEY = 'test_resend_secret'
  delete process.env.EMAIL_FROM
  await assert.rejects(service.sendEmail({}), { code: 'EMAIL_SENDER_NOT_CONFIGURED', statusCode: 503 })

  t.after(() => {
    restoreEnvironment('RESEND_API_KEY', originalApiKey)
    restoreEnvironment('EMAIL_FROM', originalSender)
  })
})

test('rejects invalid sender addresses without making an API request', async () => {
  process.env.RESEND_API_KEY = 'test_resend_secret'
  process.env.EMAIL_FROM = 'not-an-email'
  const service = createEmailService({ fetchImpl: async () => assert.fail('fetch should not be called') })

  await assert.rejects(service.sendEmail({}), { code: 'EMAIL_SENDER_INVALID', statusCode: 503 })
})

test('categorizes sender rejection without logging provider messages or credentials', async () => {
  process.env.RESEND_API_KEY = 'test_resend_secret'
  process.env.EMAIL_FROM = 'otp@example.test'
  let logged
  console.error = (...args) => { logged = args }
  const service = createEmailService({
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        name: 'validation_error',
        message: 'The sender domain is not verified for test_resend_secret.',
      }),
    }),
  })

  await assert.rejects(service.sendEmail({}), (error) => {
    assert.equal(error.code, 'RESEND_SENDER_REJECTED')
    assert.equal(error.statusCode, 503)
    assert.doesNotMatch(error.message, /test_resend_secret|verified|403/)
    return true
  })
  assert.deepEqual(logged, ['Resend email delivery failed:', {
    code: 'RESEND_SENDER_REJECTED',
    status: 403,
  }])
})

test('logs only a safe failure code when a network request fails', async () => {
  process.env.RESEND_API_KEY = 'test_resend_secret'
  process.env.EMAIL_FROM = 'otp@example.test'
  let logged
  console.error = (...args) => { logged = args }
  const service = createEmailService({
    fetchImpl: async () => {
      throw new Error('test_resend_secret request failure')
    },
  })

  await assert.rejects(service.sendEmail({}), {
    code: 'RESEND_NETWORK_ERROR',
    statusCode: 503,
  })
  assert.deepEqual(logged, ['Resend email delivery failed:', { code: 'RESEND_NETWORK_ERROR' }])
})

test('classifies timeout failures without exposing request data', async () => {
  process.env.RESEND_API_KEY = 'test_resend_secret'
  process.env.EMAIL_FROM = 'otp@example.test'
  let logged
  console.error = (...args) => { logged = args }
  const service = createEmailService({
    timeoutMs: 1,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('request aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }),
  })

  await assert.rejects(service.sendEmail({}), {
    code: 'RESEND_TIMEOUT',
    statusCode: 503,
  })
  assert.deepEqual(logged, ['Resend email delivery failed:', { code: 'RESEND_TIMEOUT' }])
})

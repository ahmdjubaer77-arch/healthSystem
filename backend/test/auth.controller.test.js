const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const otpService = require('../src/services/otp.service')
const authController = require('../src/controllers/auth.controller')
const errorMiddleware = require('../src/middleware/error.middleware')

const originalRequestPasswordReset = otpService.requestPasswordReset

after(() => {
  otpService.requestPasswordReset = originalRequestPasswordReset
})

test('password reset responds only after OTP delivery completes', async () => {
  let finishDelivery
  let responseSent = false
  let receivedOptions
  otpService.requestPasswordReset = async (_email, options) => {
    receivedOptions = options
    await new Promise((resolve) => { finishDelivery = resolve })
  }
  const res = {
    status(statusCode) {
      assert.equal(statusCode, 200)
      return this
    },
    json(body) {
      responseSent = true
      assert.equal(body.success, true)
      assert.match(body.message, /If an account exists/)
    },
  }

  const request = authController.requestPasswordReset({ body: { email: 'user@example.test' } }, res, (error) => {
    throw error
  })

  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(receivedOptions, { waitForCompletion: true })
  assert.equal(responseSent, false)
  finishDelivery()
  await request
  assert.equal(responseSent, true)
})

test('password reset forwards delivery failures without sending a success response', async () => {
  const deliveryError = Object.assign(new Error('The email could not be sent. Please request a new code shortly.'), {
    statusCode: 503,
    code: 'OTP_DELIVERY_FAILED',
    exposeMessage: true,
  })
  otpService.requestPasswordReset = async () => { throw deliveryError }
  let sentSuccess = false
  let forwardedError

  await authController.requestPasswordReset(
    { body: { email: 'user@example.test' } },
    { status() { sentSuccess = true; return this }, json() { sentSuccess = true } },
    (error) => { forwardedError = error },
  )

  assert.equal(sentSuccess, false)
  assert.equal(forwardedError, deliveryError)
})

test('error middleware exposes only explicitly safe OTP delivery errors', () => {
  const response = (error) => {
    let body
    let statusCode
    errorMiddleware(error, {}, {
      status(code) {
        statusCode = code
        return this
      },
      json(value) { body = value },
    }, () => {})
    return { statusCode, body }
  }

  assert.deepEqual(response(Object.assign(new Error('SMTP authentication failed'), {
    statusCode: 503,
    code: 'SMTP_AUTH_ERROR',
  })), {
    statusCode: 503,
    body: { success: false, message: 'Something went wrong', data: null },
  })
  assert.deepEqual(response(Object.assign(new Error('The email could not be sent. Please request a new code shortly.'), {
    statusCode: 503,
    code: 'OTP_DELIVERY_FAILED',
    exposeMessage: true,
  })), {
    statusCode: 503,
    body: {
      success: false,
      message: 'The email could not be sent. Please request a new code shortly.',
      data: null,
      code: 'OTP_DELIVERY_FAILED',
    },
  })
})

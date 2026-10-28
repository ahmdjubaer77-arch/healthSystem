const { test } = require('node:test')
const assert = require('node:assert/strict')
const nodemailer = require('nodemailer')
const User = require('../src/models/User')
const { sendFeedback } = require('../src/services/feedback.service')

const mailEnvironment = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'FEEDBACK_RECIPIENT']

function saveEnvironment() {
  return Object.fromEntries(mailEnvironment.map((key) => [key, process.env[key]]))
}

function restoreEnvironment(saved) {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

test('sends authenticated user feedback to the configured inbox with escaped HTML', async () => {
  const savedEnvironment = saveEnvironment()
  const originalCreateTransport = nodemailer.createTransport
  const originalFindById = User.findById
  let mailOptions

  try {
    process.env.GMAIL_USER = 'sender@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'test-app-password'
    process.env.FEEDBACK_RECIPIENT = 'feedback@example.com'
    User.findById = () => ({
      select: () => ({
        lean: async () => ({ name: '<Patient>', email: 'patient@example.com' }),
      }),
    })
    nodemailer.createTransport = (options) => {
      assert.equal(options.service, 'gmail')
      return {
        sendMail: async (options) => {
          mailOptions = options
        },
      }
    }

    await sendFeedback({
      userId: 'patient-id',
      category: 'General feedback',
      message: 'Please improve <this> feature.',
    })

    assert.equal(mailOptions.to, 'feedback@example.com')
    assert.equal(mailOptions.replyTo, 'patient@example.com')
    assert.equal(mailOptions.subject, '[Nirogix Feedback] General feedback')
    assert.match(mailOptions.html, /&lt;Patient&gt;/)
    assert.match(mailOptions.html, /&lt;this&gt;/)
    assert.match(mailOptions.text, /Please improve <this> feature\./)
  } finally {
    restoreEnvironment(savedEnvironment)
    nodemailer.createTransport = originalCreateTransport
    User.findById = originalFindById
  }
})

test('rejects invalid feedback and reports missing Gmail configuration', async () => {
  const savedEnvironment = saveEnvironment()
  try {
    for (const key of mailEnvironment) delete process.env[key]

    await assert.rejects(
      sendFeedback({ userId: 'patient-id', category: 'Unknown', message: 'Long enough feedback.' }),
      (error) => error.statusCode === 400,
    )
    await assert.rejects(
      sendFeedback({ userId: 'patient-id', category: 'General feedback', message: 'Long enough feedback.' }),
      (error) => error.statusCode === 503,
    )
  } finally {
    restoreEnvironment(savedEnvironment)
  }
})

const nodemailer = require('nodemailer')
const User = require('../models/User')

const categories = new Set(['General feedback', 'Bug report', 'Feature request'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

async function sendFeedback({ userId, category, message }) {
  const normalizedMessage = typeof message === 'string' ? message.trim() : ''
  if (!categories.has(category) || normalizedMessage.length < 10 || normalizedMessage.length > 3000) {
    throw createError('Choose a feedback type and enter a message between 10 and 3000 characters.', 400)
  }

  const { GMAIL_USER, GMAIL_APP_PASSWORD, FEEDBACK_RECIPIENT } = process.env
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !FEEDBACK_RECIPIENT) {
    throw createError('Feedback email is not configured. Please try again later.', 503)
  }

  const user = await User.findById(userId).select('name email').lean()
  if (!user) {
    throw createError('Your account could not be found. Please sign in again.', 401)
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  })

  const safeName = escapeHtml(user.name)
  const safeEmail = escapeHtml(user.email)
  const safeCategory = escapeHtml(category)
  const safeMessage = escapeHtml(normalizedMessage).replace(/\r?\n/g, '<br>')

  await transporter.sendMail({
    from: `"Nirogix Feedback" <${GMAIL_USER}>`,
    to: FEEDBACK_RECIPIENT,
    replyTo: user.email,
    subject: `[Nirogix Feedback] ${category}`,
    text: `From: ${user.name} (${user.email})\nCategory: ${category}\n\n${normalizedMessage}`,
    html: `<h2>New Nirogix feedback</h2><p><strong>From:</strong> ${safeName} (${safeEmail})</p><p><strong>Category:</strong> ${safeCategory}</p><p>${safeMessage}</p>`,
  })
}

module.exports = { sendFeedback }

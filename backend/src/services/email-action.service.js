const crypto = require('crypto')
const bcrypt = require('bcrypt')
const EmailActionToken = require('../models/EmailActionToken')
const User = require('../models/User')
const { sendOtpEmail } = require('./email.service')

const OTP_LIFETIME_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5
const BCRYPT_ROUNDS = 10
const TOKEN_PURPOSE = {
  emailVerification: 'EMAIL_VERIFICATION',
  passwordReset: 'PASSWORD_RESET',
  emailChange: 'EMAIL_CHANGE',
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createError(message, statusCode, code) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (code) error.code = code
  return error
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function createOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

async function issueOtp(user, purpose, targetEmail, emailDetails) {
  const code = createOtp()
  const otp = await EmailActionToken.create({
    userId: user._id,
    purpose,
    tokenHash: await bcrypt.hash(code, BCRYPT_ROUNDS),
    targetEmail,
    expiresAt: new Date(Date.now() + OTP_LIFETIME_MS),
  })

  try {
    await sendOtpEmail({ to: targetEmail || user.email, ...emailDetails, code, name: user.name })
  } catch (error) {
    await EmailActionToken.deleteOne({ _id: otp._id })
    throw error
  }
  await EmailActionToken.deleteMany({ userId: user._id, purpose, _id: { $ne: otp._id } })
}

async function findActiveOtp(userId, purpose, targetEmail) {
  return EmailActionToken.findOne({
    userId,
    purpose,
    ...(targetEmail ? { targetEmail } : {}),
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
}

async function sendVerificationEmail(userId) {
  const user = await User.findById(userId)
  if (!user || user.emailVerified) return false

  const activeOtp = await findActiveOtp(user._id, TOKEN_PURPOSE.emailVerification)
  if (activeOtp && Date.now() - activeOtp.createdAt.getTime() < RESEND_COOLDOWN_MS) return false

  await issueOtp(user, TOKEN_PURPOSE.emailVerification, user.email, {
    subject: 'Your Nirogix email verification code',
    action: 'Use this code to verify your email address.',
  })
  return true
}

async function resendVerificationEmail(input = {}) {
  const email = normalizeEmail(input.email)
  if (EMAIL_PATTERN.test(email)) {
    const user = await User.findOne({ email, emailVerified: false, emailVerificationRequired: true })
    if (user) await sendVerificationEmail(user._id)
  }
  return { message: 'If this address needs verification, a code will be sent.' }
}

async function requestPasswordReset(input = {}) {
  const email = normalizeEmail(input.email)
  if (EMAIL_PATTERN.test(email)) {
    const user = await User.findOne({ email, accountStatus: 'ACTIVE' })
    if (user) {
      const activeOtp = await findActiveOtp(user._id, TOKEN_PURPOSE.passwordReset)
      if (!activeOtp || Date.now() - activeOtp.createdAt.getTime() >= RESEND_COOLDOWN_MS) {
        await issueOtp(user, TOKEN_PURPOSE.passwordReset, user.email, {
          subject: 'Your Nirogix password reset code',
          action: 'Use this code to reset your password.',
        })
      }
    }
  }
  return { message: 'If an account exists for this address, a code will be sent.' }
}

function validateOtp(code) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw createError('Enter the 6-digit code from your email.', 400, 'INVALID_OTP')
  }
}

async function consumeOtp(email, code, purpose) {
  validateOtp(code)
  const actionOtp = await EmailActionToken.findOne({
    purpose,
    targetEmail: email,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (!actionOtp) {
    throw createError('This code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP')
  }

  if (actionOtp.attempts >= MAX_ATTEMPTS) {
    const consumed = await EmailActionToken.deleteOne({ _id: actionOtp._id })
    if (consumed.deletedCount !== 1) {
      throw createError('This code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP')
    }
    throw createError('Too many incorrect attempts. Request a new code.', 429, 'OTP_ATTEMPTS_EXCEEDED')
  }

  if (!(await bcrypt.compare(code, actionOtp.tokenHash))) {
    const updatedOtp = await EmailActionToken.findOneAndUpdate(
      { _id: actionOtp._id, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true },
    )
    if (!updatedOtp || updatedOtp.attempts >= MAX_ATTEMPTS) {
      await EmailActionToken.deleteOne({ _id: actionOtp._id })
      throw createError('Too many incorrect attempts. Request a new code.', 429, 'OTP_ATTEMPTS_EXCEEDED')
    }
    throw createError('The code is incorrect. Please try again.', 400, 'INVALID_OTP')
  }

  await EmailActionToken.deleteOne({ _id: actionOtp._id })
  return actionOtp
}

async function verifyEmail(input = {}) {
  const email = normalizeEmail(input.email)
  const purpose = input.purpose === TOKEN_PURPOSE.emailChange
    ? TOKEN_PURPOSE.emailChange
    : TOKEN_PURPOSE.emailVerification
  const actionOtp = await consumeOtp(email, input.code, purpose)
  const user = await User.findById(actionOtp.userId)
  if (!user) throw createError('This code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP')

  if (purpose === TOKEN_PURPOSE.emailChange) {
    if (await User.exists({ email })) {
      throw createError('This email address is already associated with an account.', 409)
    }
    user.email = email
  } else if (user.email !== email) {
    throw createError('This code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP')
  }

  user.emailVerified = true
  user.emailVerificationRequired = false
  await user.save()
  return { verified: true, changed: purpose === TOKEN_PURPOSE.emailChange }
}

async function resetPassword(input = {}) {
  const email = normalizeEmail(input.email)
  const password = typeof input.password === 'string' ? input.password : ''
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : ''
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw createError('Password must be at least 8 characters and no more than 72 bytes.', 400)
  }
  if (password !== confirmPassword) throw createError('Passwords do not match.', 400)

  const actionOtp = await consumeOtp(email, input.code, TOKEN_PURPOSE.passwordReset)
  const user = await User.findById(actionOtp.userId).select('+passwordHash')
  if (!user || user.email !== email) {
    throw createError('This code is invalid or has expired.', 400, 'INVALID_OR_EXPIRED_OTP')
  }

  user.passwordHash = await bcrypt.hash(password, 12)
  await user.save()
  await EmailActionToken.deleteMany({ userId: user._id, purpose: TOKEN_PURPOSE.passwordReset })
  return { changed: true }
}

async function requestEmailChange(userId, input = {}) {
  const email = normalizeEmail(input.email)
  const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : ''
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw createError('A valid email address is required.', 400)
  }
  if (!currentPassword) throw createError('Your current password is required.', 400)

  const user = await User.findById(userId).select('+passwordHash')
  if (!user) throw createError('User profile not found.', 404)
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw createError('Your current password is incorrect.', 401)
  }
  if (email === user.email) throw createError('Enter an email address different from your current one.', 400)
  if (await User.exists({ email })) throw createError('An account with this email already exists.', 409)

  const activeOtp = await findActiveOtp(user._id, TOKEN_PURPOSE.emailChange, email)
  if (!activeOtp || Date.now() - activeOtp.createdAt.getTime() >= RESEND_COOLDOWN_MS) {
    await issueOtp(user, TOKEN_PURPOSE.emailChange, email, {
      subject: 'Your Nirogix email change code',
      action: 'Use this code to confirm your new email address.',
    })
  }
  return { message: 'A confirmation code was sent to your new email address.' }
}

module.exports = {
  sendVerificationEmail,
  resendVerificationEmail,
  requestPasswordReset,
  verifyEmail,
  resetPassword,
  requestEmailChange,
}

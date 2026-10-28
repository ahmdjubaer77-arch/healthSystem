const bcrypt = require('bcrypt')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const OneTimeCode = require('../models/OneTimeCode')
const User = require('../models/User')

const OTP_LIFETIME_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5
const PASSWORD_SALT_ROUNDS = 12

function createError(message, statusCode, code, exposeMessage = false) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (code) error.code = code
  if (exposeMessage) error.exposeMessage = true
  return error
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
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

function createOtpService({
  UserModel = User,
  CodeModel = OneTimeCode,
  now = Date.now,
  randomInt = crypto.randomInt,
  createTransport = nodemailer.createTransport,
  emailDeliveryTimeoutMs = 20_000,
} = {}) {
  function getHashSecret() {
    const secret = process.env.JWT_SECRET
    if (!secret) throw createError('OTP service is not configured.', 503)
    return secret
  }

  function hashValue(value) {
    return crypto.createHmac('sha256', getHashSecret()).update(value).digest('hex')
  }

  function valuesMatch(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false
    const leftBuffer = Buffer.from(left, 'hex')
    const rightBuffer = Buffer.from(right, 'hex')
    return leftBuffer.length === rightBuffer.length
      && leftBuffer.length > 0
      && crypto.timingSafeEqual(leftBuffer, rightBuffer)
  }

  function createTransporter() {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw createError('Email verification is not configured. Please try again later.', 503, 'OTP_DELIVERY_FAILED', true)
    }

    return createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  }

  async function sendOtpEmail(email, name, purpose, otp) {
    const { GMAIL_USER } = process.env
    const transporter = createTransporter()
    const safeName = escapeHtml(name || 'there')
    const subject = purpose === 'EMAIL_VERIFICATION'
      ? 'Verify your Nirogix X email'
      : purpose === 'EMAIL_CHANGE'
        ? 'Confirm your new Nirogix X email'
        : 'Your Nirogix X password reset code'
    const action = purpose === 'EMAIL_VERIFICATION'
      ? 'Use this code to verify your email address and finish setting up your account.'
      : purpose === 'EMAIL_CHANGE'
        ? 'Use this code to confirm the new email address on your account.'
        : 'Use this code to continue resetting your password.'

    let deliveryTimeout
    try {
      const delivery = transporter.sendMail({
        from: `"Nirogix X" <${GMAIL_USER}>`,
        to: email,
        subject,
        text: `Hello ${name || 'there'},\n\n${action}\n\nYour verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not request this code, ignore this email.\n\nNirogix X`,
        html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f6f8;color:#263746;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${subject}. Your code expires in 5 minutes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background-color:#f3f6f8">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:480px;border:1px solid #e3e9ee;border-radius:12px;border-collapse:separate;background-color:#ffffff">
            <tr>
              <td style="padding:28px 28px 8px">
                <p style="margin:0;color:#087e8b;font-size:15px;font-weight:bold;letter-spacing:1.6px">NIROGIX X</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0">
                <h1 style="margin:0;color:#182b3a;font-size:23px;line-height:1.3;font-weight:700">Your verification code</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0">
                <p style="margin:0;color:#465867;font-size:15px;line-height:1.65">Hello ${safeName},</p>
                <p style="margin:8px 0 0;color:#465867;font-size:15px;line-height:1.65">${action}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;border:1px solid #dce8ec;border-radius:8px;border-collapse:separate;background-color:#f7fafb">
                  <tr>
                    ${otp.split('').map((digit) => `<td align="center" width="16.66%" style="width:16.66%;padding:16px 0;color:#087e8b;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:bold;line-height:1.2">${digit}</td>`).join('')}
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0">
                <p style="margin:0;color:#465867;font-size:14px;line-height:1.6">This code expires in <strong style="color:#263746">5 minutes</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 26px">
                <p style="margin:0;padding-top:16px;border-top:1px solid #e8edf0;color:#71808c;font-size:13px;line-height:1.6">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#87939d;font-size:12px;line-height:1.5">Nirogix X · Healthcare, made easier</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
      })
      const timeout = new Promise((_, reject) => {
        deliveryTimeout = setTimeout(() => {
          const error = new Error('OTP email delivery timed out.')
          error.code = 'ETIMEDOUT'
          reject(error)
        }, emailDeliveryTimeoutMs)
      })
      await Promise.race([delivery, timeout])
    } catch (error) {
      console.error('OTP email delivery failed:', error.code || error.name || 'unknown error')
      throw createError('The email could not be sent. Please request a new code shortly.', 503, 'OTP_DELIVERY_FAILED', true)
    } finally {
      clearTimeout(deliveryTimeout)
      transporter.close?.()
    }
  }

  async function issueCode(email, name, purpose, waitForDelivery = false, extraFields = {}) {
    const currentTime = now()
    const sentAt = new Date(currentTime)
    const otp = randomInt(0, 1000000).toString().padStart(6, '0')
    const otpExpiresAt = new Date(currentTime + OTP_LIFETIME_MS)
    const update = {
      $set: {
        otpHash: hashValue(otp),
        otpExpiresAt,
        attempts: 0,
        lastSentAt: sentAt,
        usedAt: null,
        resetTokenHash: null,
        resetExpiresAt: null,
        expiresAt: otpExpiresAt,
        ...extraFields,
      },
    }
    const eligibleForResend = {
      email,
      purpose,
      $or: [
        { lastSentAt: { $lte: new Date(currentTime - RESEND_COOLDOWN_MS) } },
        { lastSentAt: { $exists: false } },
      ],
    }

    let challenge = await CodeModel.findOneAndUpdate(eligibleForResend, update, { new: true })
    if (!challenge) {
      try {
        challenge = await CodeModel.create({
          email,
          purpose,
          otpHash: update.$set.otpHash,
          otpExpiresAt,
          attempts: 0,
          lastSentAt: sentAt,
          expiresAt: otpExpiresAt,
          ...extraFields,
        })
      } catch (error) {
        if (error.code !== 11000) throw error
        challenge = await CodeModel.findOneAndUpdate(eligibleForResend, update, { new: true })
      }
    }

    if (!challenge) {
      throw createError('Please wait before requesting another code.', 429, 'OTP_RESEND_COOLDOWN')
    }

    const delivery = sendOtpEmail(extraFields.pendingEmail || email, name, purpose, otp)
    if (waitForDelivery) {
      try {
        await delivery
      } catch (error) {
        await CodeModel.updateOne({
          _id: challenge._id,
          otpHash: update.$set.otpHash,
        }, {
          $set: {
            otpHash: null,
            usedAt: sentAt,
            lastSentAt: new Date(0),
            pendingEmail: null,
          },
        })
        throw error
      }
    } else {
      delivery.catch((error) => {
        console.error('OTP email delivery failed:', error.code || error.name || 'unknown error')
      })
    }
  }

  async function verifyCode(email, purpose, code) {
    const normalizedEmail = normalizeEmail(email)
    const normalizedCode = typeof code === 'string' ? code.trim() : ''
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw createError('Enter the 6-digit code from your email.', 400, 'OTP_INVALID')
    }

    const challenge = await CodeModel.findOne({ email: normalizedEmail, purpose })
    const currentTime = now()
    if (!challenge || challenge.usedAt || !challenge.otpHash
      || challenge.otpExpiresAt.getTime() <= currentTime) {
      throw createError(
        'The code is invalid or has expired. Request a new code.',
        400,
        purpose === 'PASSWORD_RESET' ? 'OTP_INVALID' : 'OTP_EXPIRED',
      )
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw createError(
        'The code is invalid or has expired. Request a new code.',
        purpose === 'PASSWORD_RESET' ? 400 : 429,
        purpose === 'PASSWORD_RESET' ? 'OTP_INVALID' : 'OTP_ATTEMPTS_EXCEEDED',
      )
    }

    const submittedHash = hashValue(normalizedCode)
    if (!valuesMatch(challenge.otpHash, submittedHash)) {
      await CodeModel.updateOne(
        { _id: challenge._id, usedAt: null, attempts: { $lt: MAX_ATTEMPTS } },
        { $inc: { attempts: 1 } },
      )
      throw createError('The code is incorrect. Check it and try again.', 400, 'OTP_INVALID')
    }

    return { challenge, submittedHash }
  }

  async function verifyEmail({ email, code }) {
    const normalizedEmail = normalizeEmail(email)
    const { challenge, submittedHash } = await verifyCode(normalizedEmail, 'EMAIL_VERIFICATION', code)
    const consumed = await CodeModel.findOneAndUpdate({
      _id: challenge._id,
      otpHash: submittedHash,
      otpExpiresAt: { $gt: new Date(now()) },
      attempts: { $lt: MAX_ATTEMPTS },
      usedAt: null,
    }, {
      $set: { usedAt: new Date(now()), otpHash: null },
    }, { new: true })

    if (!consumed) {
      throw createError('This code is invalid or has already been used.', 400, 'OTP_INVALID')
    }

    const result = await UserModel.updateOne(
      { email: normalizedEmail, emailVerificationRequired: true },
      { $set: { emailVerified: true, emailVerificationRequired: false } },
    )
    if (!result.matchedCount) {
      throw createError('This account does not need email verification.', 400, 'EMAIL_VERIFICATION_NOT_REQUIRED')
    }
  }

  async function requestEmailVerification(email, { waitForDelivery = false, waitForCompletion = true } = {}) {
    const operation = async () => {
      const normalizedEmail = normalizeEmail(email)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw createError('Enter a valid email address.', 400, 'EMAIL_INVALID')
      }
      const user = await UserModel.findOne({ email: normalizedEmail })
      if (!user || !user.emailVerificationRequired || user.emailVerified) return
      await issueCode(normalizedEmail, user.name, 'EMAIL_VERIFICATION', waitForDelivery)
    }

    if (waitForCompletion) return operation()
    void operation().catch((error) => {
      console.error('Email verification code request failed:', error.code || error.name || 'unknown error')
    })
  }

  async function requestPasswordReset(email, { waitForCompletion = true } = {}) {
    const operation = async () => {
      const normalizedEmail = normalizeEmail(email)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return
      const user = await UserModel.findOne({ email: normalizedEmail, accountStatus: 'ACTIVE' })
      if (!user || user.donorStandalone) return
      await issueCode(normalizedEmail, user.name, 'PASSWORD_RESET', true)
    }

    if (waitForCompletion) return operation()
    void operation().catch((error) => {
      console.error('Password reset code request failed:', error.code || error.name || 'unknown error')
    })
  }

  async function confirmPasswordReset({ email, code }) {
    const normalizedEmail = normalizeEmail(email)
    const { challenge, submittedHash } = await verifyCode(normalizedEmail, 'PASSWORD_RESET', code)
    const resetToken = crypto.randomBytes(32).toString('base64url')
    const resetExpiresAt = new Date(now() + OTP_LIFETIME_MS)
    const consumed = await CodeModel.findOneAndUpdate({
      _id: challenge._id,
      otpHash: submittedHash,
      otpExpiresAt: { $gt: new Date(now()) },
      attempts: { $lt: MAX_ATTEMPTS },
      usedAt: null,
    }, {
      $set: {
        usedAt: new Date(now()),
        otpHash: null,
        resetTokenHash: hashValue(resetToken),
        resetExpiresAt,
        expiresAt: resetExpiresAt,
      },
    }, { new: true })

    if (!consumed) {
      throw createError('This code is invalid or has already been used.', 400, 'OTP_INVALID')
    }
    return { resetToken, expiresIn: OTP_LIFETIME_MS / 1000 }
  }

  async function requestEmailChange(userId, email) {
    const normalizedEmail = normalizeEmail(email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      throw createError('Enter a valid email address.', 400, 'EMAIL_INVALID')
    }

    const user = await UserModel.findById(userId).select('email name')
    if (!user) throw createError('User profile not found.', 404, 'ACCOUNT_NOT_FOUND')
    if (user.email.toLowerCase() === normalizedEmail) {
      throw createError('This is already your current email address.', 400, 'EMAIL_UNCHANGED')
    }

    const existing = await UserModel.exists({ email: normalizedEmail })
    if (existing) throw createError('This email address is already in use.', 409, 'EMAIL_IN_USE')

    await issueCode(user.email.toLowerCase(), user.name, 'EMAIL_CHANGE', true, {
      userId: user._id,
      pendingEmail: normalizedEmail,
    })
    return { email: normalizedEmail }
  }

  async function confirmEmailChange(userId, code) {
    const challenge = await CodeModel.findOne({ userId, purpose: 'EMAIL_CHANGE' })
    if (!challenge?.pendingEmail) {
      throw createError('No email change is waiting for verification.', 400, 'EMAIL_CHANGE_NOT_PENDING')
    }

    const { submittedHash } = await verifyCode(challenge.email, 'EMAIL_CHANGE', code)
    let updatedUser
    try {
      updatedUser = await UserModel.findOneAndUpdate({
        _id: userId,
        email: challenge.email,
      }, {
        $set: {
          email: challenge.pendingEmail,
          emailVerified: true,
          emailVerificationRequired: false,
        },
      }, { new: true })
    } catch (error) {
      if (error.code === 11000) {
        throw createError('This email address is already in use.', 409, 'EMAIL_IN_USE')
      }
      throw error
    }

    if (!updatedUser) {
      const currentUser = await UserModel.findById(userId).select('email')
      if (currentUser?.email?.toLowerCase() !== challenge.pendingEmail) {
        throw createError('The account email has changed. Request a new code.', 409, 'EMAIL_CHANGE_STALE')
      }
      updatedUser = currentUser
    }

    const consumed = await CodeModel.findOneAndUpdate({
      _id: challenge._id,
      otpHash: submittedHash,
      otpExpiresAt: { $gt: new Date(now()) },
      attempts: { $lt: MAX_ATTEMPTS },
      usedAt: null,
    }, {
      $set: { usedAt: new Date(now()), otpHash: null, pendingEmail: null },
    }, { new: true })

    if (!consumed && updatedUser.email.toLowerCase() !== challenge.pendingEmail) {
      throw createError('This code is invalid or has already been used.', 400, 'OTP_INVALID')
    }

    return { email: updatedUser.email }
  }

  async function resetPassword({ email, resetToken, password, confirmPassword }) {
    const normalizedEmail = normalizeEmail(email)
    if (typeof password !== 'string' || password.length < 8
      || Buffer.byteLength(password, 'utf8') > 72) {
      throw createError('Password must be at least 8 characters and no more than 72 bytes.', 400, 'PASSWORD_INVALID')
    }
    if (password !== confirmPassword) {
      throw createError('Passwords do not match.', 400, 'PASSWORD_MISMATCH')
    }
    if (typeof resetToken !== 'string' || resetToken.length < 32) {
      throw createError('Password reset authorization is invalid or expired.', 400, 'RESET_AUTH_INVALID')
    }

    const consumed = await CodeModel.findOneAndUpdate({
      email: normalizedEmail,
      purpose: 'PASSWORD_RESET',
      resetTokenHash: hashValue(resetToken),
      resetExpiresAt: { $gt: new Date(now()) },
    }, {
      $set: { resetTokenHash: null, resetExpiresAt: null, usedAt: new Date(now()) },
    }, { new: true })
    if (!consumed) {
      throw createError('Password reset authorization is invalid or expired.', 400, 'RESET_AUTH_INVALID')
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
    const result = await UserModel.updateOne(
      { email: normalizedEmail, accountStatus: 'ACTIVE' },
      { $set: { passwordHash, emailVerified: true, emailVerificationRequired: false } },
    )
    if (!result.matchedCount) {
      throw createError('Account could not be found.', 404, 'ACCOUNT_NOT_FOUND')
    }
  }

  return {
    requestEmailVerification,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    resetPassword,
    requestEmailChange,
    confirmEmailChange,
    constants: { OTP_LIFETIME_MS, RESEND_COOLDOWN_MS, MAX_ATTEMPTS },
  }
}

module.exports = { createOtpService, ...createOtpService() }

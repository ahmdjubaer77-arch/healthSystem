const bcrypt = require('bcrypt')
const User = require('../models/User')
const { createUserWithPublicId } = require('../utils/public-user-id')

const SALT_ROUNDS = 12
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!email && !password) return null
  if (!email || !password || !EMAIL_PATTERN.test(email) || email.length > 254) {
    throw createError('SUPER_ADMIN_EMAIL must be a valid email address', 400)
  }

  if (password.length < 8 || password.length > 72 || Buffer.byteLength(password, 'utf8') > 72) {
    throw createError('SUPER_ADMIN_PASSWORD must be between 8 and 72 characters', 400)
  }

  const existing = await User.findOne({ email })
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      throw createError('The configured SUPER_ADMIN_EMAIL is already assigned to another role', 409)
    }
    return existing
  }

  return createUserWithPublicId({
    name: 'Platform Super Admin',
    email,
    passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    role: 'SUPER_ADMIN',
    accountStatus: 'ACTIVE',
    emailVerified: false,
    emailVerificationRequired: true,
  }, User)
}

module.exports = { seedSuperAdmin }

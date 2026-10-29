const bcrypt = require('bcrypt')
const User = require('../models/User')
const AdminAuditLog = require('../models/AdminAuditLog')
const { createUserWithPublicId } = require('../utils/public-user-id')
const emailActionService = require('./email-action.service')

const SALT_ROUNDS = 12
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function validateAdminInput(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const role = typeof input.role === 'string' ? input.role : ''

  if (!name || !email || !password || !ADMIN_ROLES.has(role)) {
    throw createError('Name, email, password, and a valid admin role are required', 400)
  }

  if (name.length < 2 || name.length > 100) {
    throw createError('Name must be between 2 and 100 characters', 400)
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw createError('A valid email address is required', 400)
  }

  if (password.length < 8 || password.length > 72 || Buffer.byteLength(password, 'utf8') > 72) {
    throw createError('Password must be between 8 and 72 characters', 400)
  }

  return { name, email, password, role }
}

async function createAdmin(input, actor) {
  const { name, email, password, role } = validateAdminInput(input)

  if (actor.role !== 'SUPER_ADMIN') {
    throw createError('Only a Super Admin can create administrator accounts', 403)
  }

  if (role === 'SUPER_ADMIN') {
    throw createError('Only a Super Admin can create another Super Admin', 403)
  }

  const duplicate = await User.exists({ email })
  if (duplicate) {
    throw createError('An account with this email already exists', 409)
  }

  const user = await createUserWithPublicId({
    name,
    email,
    passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    role,
    accountStatus: 'ACTIVE',
    emailVerified: false,
    emailVerificationRequired: true,
  }, User)

  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: 'admin.created',
    entityType: 'User',
    entityId: user._id,
    targetUser: user._id,
    result: 'SUCCESS',
    details: { role, createdBy: actor.userId },
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })

  await emailActionService.sendVerificationEmail(user._id)

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  }
}

module.exports = { createAdmin }

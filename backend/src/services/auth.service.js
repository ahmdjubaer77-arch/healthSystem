const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { createUserWithPublicId } = require('../utils/public-user-id')

const SALT_ROUNDS = 12
const INVALID_CREDENTIALS = 'Invalid email or password'
const bloodGroups = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

function createError(message, statusCode, code) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (code) error.code = code
  return error
}

function registrationUser(user) {
  return {
    id: user._id.toString(),
    publicUserId: user.publicUserId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
  }
}

function loginUser(user) {
  return {
    id: user._id.toString(),
    publicUserId: user.publicUserId,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

async function register(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim() || undefined : undefined
  const password = typeof input.password === 'string' ? input.password : ''
  const bloodGroup = typeof input.bloodGroup === 'string' ? input.bloodGroup : undefined

  if (!name || !email || !password) {
    throw createError('Name, email, and password are required', 400)
  }

  if (bloodGroup && !bloodGroups.has(bloodGroup)) {
    throw createError('Blood group is invalid', 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('A valid email is required', 400)
  }

  if (name.length < 2 || name.length > 100 || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw createError('Name or password does not meet the required length', 400)
  }

  if (phone && phone.length > 20) {
    throw createError('Phone number is too long', 400)
  }

  const duplicate = await User.exists({
    $or: [
      { email },
      ...(phone ? [{ phone }] : []),
    ],
  })

  if (duplicate) {
    throw createError('Email or phone number already registered', 409)
  }

  try {
    const user = await createUserWithPublicId({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role: 'PATIENT',
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      location: input.location,
      bloodGroup,
      accountStatus: 'ACTIVE',
      emailVerified: false,
      emailVerificationRequired: true,
    }, User)

    return registrationUser(user)
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.publicUserId || error.keyValue?.publicUserId) {
        throw createError('Unable to allocate a unique public user ID. Please try again.', 503)
      }
      throw createError('Email or phone number already registered', 409)
    }

    if (error.name === 'ValidationError') {
      throw createError('Registration details are invalid', 400)
    }

    throw error
  }
}

async function login(input = {}) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''

  const user = email ? await User.findOne({ email }).select('+passwordHash') : null

  if (!user || user.donorStandalone || user.accountStatus !== 'ACTIVE') {
    throw createError(INVALID_CREDENTIALS, 401)
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw createError(INVALID_CREDENTIALS, 401)
  }

  if (user.emailVerificationRequired && !user.emailVerified) {
    throw createError('Please verify your email address before signing in.', 403, 'EMAIL_NOT_VERIFIED')
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  const accessToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  )

  user.lastLoginAt = new Date()
  await user.save()

  return { user: loginUser(user), accessToken }
}

module.exports = { register, login }
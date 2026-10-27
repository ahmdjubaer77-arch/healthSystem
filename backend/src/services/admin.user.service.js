const mongoose = require('mongoose')
const User = require('../models/User')
const AdminAuditLog = require('../models/AdminAuditLog')

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const USER_ROLES = new Set([
  'PATIENT',
  'DOCTOR',
  'PHARMACY',
  'HOSPITAL',
  'BLOOD_DONOR',
  'AMBULANCE_PROVIDER',
  'ADMIN',
  'SUPER_ADMIN',
])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function buildUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.donorStandalone ? null : user.email,
    phone: user.phone || null,
    role: user.role,
    location: user.location || null,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function buildLocationFilter(location) {
  if (!location) return {}
  const terms = [location.division, location.district, location.upazila, location.area]
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase())

  if (!terms.length) return {}
  return { location: { $regex: terms.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'), $options: 'i' } }
}

function buildDateFilter(startDate, endDate) {
  const filter = {}
  if (startDate) filter.$gte = new Date(startDate)
  if (endDate) filter.$lte = new Date(endDate)
  return filter
}

function validatePagination(page, limit) {
  const parsedPage = Number.parseInt(page, 10)
  const parsedLimit = Number.parseInt(limit, 10)
  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 20,
  }
}

async function getUsers(query) {
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = {}

  if (query.search) {
    const escapedSearch = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
    ]
  }

  if (query.role && USER_ROLES.has(query.role)) filter.role = query.role
  if (query.status && ['ACTIVE', 'SUSPENDED'].includes(query.status)) filter.accountStatus = query.status
  Object.assign(filter, buildLocationFilter(query.location))

  if (query.createdFrom || query.createdTo) {
    filter.createdAt = buildDateFilter(query.createdFrom, query.createdTo)
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ])

  return {
    users: users.map(buildUserResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

async function getUserById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('User not found', 404)

  const user = await User.findById(id).select('-passwordHash').lean()
  if (!user) throw createError('User not found', 404)
  return buildUserResponse(user)
}

async function updateUserStatus(id, status, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('User not found', 404)
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) throw createError('Invalid account status', 400)

  const user = await User.findById(id)
  if (!user) throw createError('User not found', 404)
  if (user.role === 'SUPER_ADMIN' && user._id.toString() !== actor.userId) {
    throw createError('SUPER_ADMIN accounts cannot be suspended by this administrator', 403)
  }

  const previousStatus = user.accountStatus
  user.accountStatus = status
  await user.save()
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: status === 'SUSPENDED' ? 'user.suspend' : 'user.activate',
    entityType: 'User',
    entityId: user._id,
    details: { previousStatus, nextStatus: status },
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })

  return buildUserResponse(user)
}

async function updateUserRole(id, role, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('User not found', 404)
  if (!USER_ROLES.has(role)) throw createError('Invalid role', 400)

  const user = await User.findById(id)
  if (!user) throw createError('User not found', 404)
  if (user.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw createError('Only SUPER_ADMIN can modify another SUPER_ADMIN account', 403)
  }
  if (user._id.toString() === actor.userId && role !== actor.role) {
    throw createError('Administrators cannot change their own role', 400)
  }
  if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw createError('Only SUPER_ADMIN can assign the SUPER_ADMIN role', 403)
  }

  const previousRole = user.role
  user.role = role
  await user.save()
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: 'user.role.update',
    entityType: 'User',
    entityId: user._id,
    details: { previousRole, nextRole: role },
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })

  return buildUserResponse(user)
}

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
}

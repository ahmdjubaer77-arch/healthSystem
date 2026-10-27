const mongoose = require('mongoose')
const BloodRequest = require('../models/BloodRequest')
const AdminAuditLog = require('../models/AdminAuditLog')

const STATUSES = BloodRequest.BLOOD_REQUEST_STATUSES
const WORKFLOW_TRANSITIONS = {
  PENDING: new Set(['ACTIVE', 'CANCELLED']),
  ACTIVE: new Set(['EXPIRED', 'CANCELLED']),
  MATCHED: new Set(['CANCELLED']),
  FULFILLED: new Set(),
  EXPIRED: new Set(),
  CANCELLED: new Set(['PENDING']),
}
const BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const QUERY_FIELDS = new Set(['page', 'limit', 'status', 'bloodGroup', 'search', 'location'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function requirePermission(actor, permission) {
  if (!actor?.permissions?.includes(permission)) throw createError('Insufficient permissions', 403)
}

function validateObjectInput(input, allowedFields, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError(`A ${label} object is required`, 400)
  }
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) throw createError(`${label} field cannot be changed: ${field}`, 400)
  }
  return input
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeFilter(value, field) {
  if (value === undefined || value === '') return ''
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (normalized.length > 120) throw createError(`${field} is too long`, 400)
  return normalized
}

function sanitizeRequest(request) {
  return {
    id: request._id.toString(),
    requesterName: request.requesterName,
    bloodGroup: request.bloodGroup,
    quantity: request.quantity,
    unit: request.unit,
    hospitalName: request.hospitalName || null,
    division: request.division || null,
    district: request.district || null,
    upazila: request.upazila || null,
    locationType: request.locationType || null,
    status: request.status,
    verificationStatus: request.verificationStatus,
    verificationReason: request.verificationReason || null,
    reportReason: request.reportReason || null,
    reportedAt: request.reportedAt || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }
}

async function getBloodRequests(query = {}) {
  validateObjectInput(query, QUERY_FIELDS, 'Blood request query')
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw createError('Limit must be an integer between 1 and 100', 400)
  const filter = {}
  if (query.status !== undefined && query.status !== '') {
    if (!STATUSES.includes(query.status)) throw createError('Invalid blood request status filter', 400)
    filter.status = query.status
  }
  if (query.bloodGroup !== undefined && query.bloodGroup !== '') {
    if (typeof query.bloodGroup !== 'string' || !BLOOD_GROUPS.has(query.bloodGroup)) throw createError('Invalid blood group filter', 400)
    filter.bloodGroup = query.bloodGroup
  }
  const search = normalizeFilter(query.search, 'Search')
  const location = normalizeFilter(query.location, 'Location filter')
  const conditions = []
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { requesterName: pattern }, { hospitalName: pattern }, { bloodGroup: pattern },
      { division: pattern }, { district: pattern }, { upazila: pattern },
    ] })
  }
  if (location) {
    const pattern = { $regex: escapeRegex(location), $options: 'i' }
    conditions.push({ $or: [{ division: pattern }, { district: pattern }, { upazila: pattern }] })
  }
  if (conditions.length) filter.$and = conditions
  const [requests, total] = await Promise.all([
    BloodRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    BloodRequest.countDocuments(filter),
  ])
  return { requests: requests.map(sanitizeRequest), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
}

async function getBloodRequestById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Blood request not found', 404)
  const request = await BloodRequest.findById(id).lean()
  if (!request) throw createError('Blood request not found', 404)
  return sanitizeRequest(request)
}

async function updateBloodRequestStatus(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(input, new Set(['status', 'reason']), 'Blood request status')
  const { status, reason } = input
  if (!mongoose.isValidObjectId(id)) throw createError('Blood request not found', 404)
  if (!STATUSES.includes(status)) throw createError('Invalid blood request status', 400)
  if (reason !== undefined && typeof reason !== 'string') throw createError('Reason must be a string', 400)
  if (typeof reason === 'string' && reason.trim().length > 500) throw createError('Reason is too long', 400)
  if (status === 'MATCHED' || status === 'FULFILLED') {
    throw createError('Donor matching and hospital fulfillment confirmation are not available', 409)
  }
  const request = await BloodRequest.findById(id)
  if (!request) throw createError('Blood request not found', 404)
  if (request.status === status) throw createError('Blood request already has this status', 409)
  if (!WORKFLOW_TRANSITIONS[request.status].has(status)) throw createError('Invalid blood request status transition', 409)
  if (status === 'CANCELLED' && !String(reason || '').trim()) throw createError('A cancellation reason is required', 400)
  const previousStatus = request.status
  request.status = status
  request.metadata = { ...(request.metadata || {}), cancellationReason: status === 'CANCELLED' ? reason.trim() : undefined }
  await request.save()
  await AdminAuditLog.create({ actorId: actor.userId, actorRole: actor.role, action: 'BLOOD_REQUEST_STATUS_UPDATED', entityType: 'BloodRequest', entityId: request._id, details: { previousStatus, nextStatus: status, reason: status === 'CANCELLED' ? reason.trim() : null }, ipAddress: actor.ipAddress || null, userAgent: actor.userAgent || null })
  return sanitizeRequest(request)
}

async function reportBloodRequest(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(input, new Set(['reason']), 'Blood request flag')
  const { reason } = input
  if (typeof reason !== 'string') throw createError('A report reason is required', 400)
  const normalizedReason = reason.trim()
  if (!normalizedReason) throw createError('A report reason is required', 400)
  if (normalizedReason.length > 500) throw createError('Report reason is too long', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Blood request not found', 404)
  const request = await BloodRequest.findById(id)
  if (!request) throw createError('Blood request not found', 404)
  const previousStatus = request.status
  request.reportReason = normalizedReason
  request.reportedAt = new Date()
  await request.save()
  await AdminAuditLog.create({ actorId: actor.userId, actorRole: actor.role, action: 'BLOOD_REQUEST_FLAGGED', entityType: 'BloodRequest', entityId: request._id, details: { status: previousStatus, reportReason: normalizedReason }, ipAddress: actor.ipAddress || null, userAgent: actor.userAgent || null })
  return sanitizeRequest(request)
}

module.exports = { getBloodRequests, getBloodRequestById, updateBloodRequestStatus, reportBloodRequest }

const mongoose = require('mongoose')
const EmergencyRequest = require('../models/EmergencyRequest')
const AdminAuditLog = require('../models/AdminAuditLog')

const STATUSES = EmergencyRequest.EMERGENCY_REQUEST_STATUSES
const WORKFLOW_TRANSITIONS = {
  PENDING: new Set(['IN_PROGRESS', 'CANCELLED']),
  IN_PROGRESS: new Set(['RESOLVED', 'CANCELLED']),
  RESOLVED: new Set(),
  CANCELLED: new Set(['PENDING']),
}
const QUERY_FIELDS = new Set(['page', 'limit', 'status', 'requestType', 'search', 'location'])

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
    requestType: request.requestType,
    hospitalName: request.hospitalName || null,
    ambulanceName: request.ambulanceName || null,
    division: request.division || null,
    district: request.district || null,
    upazila: request.upazila || null,
    locationType: request.locationType || null,
    status: request.status,
    verificationStatus: request.verificationStatus,
    verificationReason: request.verificationReason || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }
}

async function getEmergencyRequests(query = {}) {
  validateObjectInput(query, QUERY_FIELDS, 'Emergency request query')
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw createError('Limit must be an integer between 1 and 100', 400)
  const filter = {}
  if (query.status !== undefined && query.status !== '') {
    if (typeof query.status !== 'string' || !STATUSES.includes(query.status)) throw createError('Invalid emergency status filter', 400)
    filter.status = query.status
  }
  const requestType = normalizeFilter(query.requestType, 'Request type filter')
  if (requestType) filter.requestType = { $regex: `^${escapeRegex(requestType)}$`, $options: 'i' }
  const search = normalizeFilter(query.search, 'Search')
  const location = normalizeFilter(query.location, 'Location filter')
  const conditions = []
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { requesterName: pattern }, { requestType: pattern }, { hospitalName: pattern }, { ambulanceName: pattern },
      { division: pattern }, { district: pattern }, { upazila: pattern },
    ] })
  }
  if (location) {
    const pattern = { $regex: escapeRegex(location), $options: 'i' }
    conditions.push({ $or: [{ division: pattern }, { district: pattern }, { upazila: pattern }] })
  }
  if (conditions.length) filter.$and = conditions
  const [requests, total] = await Promise.all([
    EmergencyRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    EmergencyRequest.countDocuments(filter),
  ])
  return { requests: requests.map(sanitizeRequest), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
}

async function getEmergencyRequestById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Emergency request not found', 404)
  const request = await EmergencyRequest.findById(id).lean()
  if (!request) throw createError('Emergency request not found', 404)
  return sanitizeRequest(request)
}

async function updateEmergencyRequestStatus(id, input, actor) {
  requirePermission(actor, 'emergency.manage')
  validateObjectInput(input, new Set(['status', 'reason']), 'Emergency request status')
  const { status, reason } = input
  if (!mongoose.isValidObjectId(id)) throw createError('Emergency request not found', 404)
  if (!STATUSES.includes(status)) throw createError('Invalid emergency request status', 400)
  if (reason !== undefined && typeof reason !== 'string') throw createError('Reason must be a string', 400)
  if (typeof reason === 'string' && reason.trim().length > 500) throw createError('Reason is too long', 400)
  const request = await EmergencyRequest.findById(id)
  if (!request) throw createError('Emergency request not found', 404)
  if (request.status === status) throw createError('Emergency request already has this status', 409)
  if (!WORKFLOW_TRANSITIONS[request.status].has(status)) throw createError('Invalid emergency request status transition', 409)
  if (status === 'CANCELLED' && !String(reason || '').trim()) throw createError('A cancellation reason is required', 400)
  const previousStatus = request.status
  request.status = status
  request.metadata = { ...(request.metadata || {}), cancellationReason: status === 'CANCELLED' ? reason.trim() : undefined }
  await request.save()
  await AdminAuditLog.create({ actorId: actor.userId, actorRole: actor.role, action: `emergency.request.${status.toLowerCase()}`, entityType: 'EmergencyRequest', entityId: request._id, details: { previousStatus, nextStatus: status, reason: status === 'CANCELLED' ? reason.trim() : null }, ipAddress: actor.ipAddress || null, userAgent: actor.userAgent || null })
  return sanitizeRequest(request)
}

module.exports = { getEmergencyRequests, getEmergencyRequestById, updateEmergencyRequestStatus }

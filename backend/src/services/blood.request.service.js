const mongoose = require('mongoose')
const BloodRequest = require('../models/BloodRequest')
const User = require('../models/User')
const AdminAuditLog = require('../models/AdminAuditLog')

const BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const URGENCY_VALUES = new Set(['STANDARD', 'URGENT', 'CRITICAL'])
const QUERY_FIELDS = new Set(['page', 'limit', 'bloodGroup', 'search', 'location'])
const INPUT_FIELDS = new Set([
  'bloodGroup', 'quantity', 'hospitalName', 'division', 'district', 'upazila',
  'requiredAt', 'urgency', 'contactPerson', 'contactPhone', 'contactPhoneConsent', 'notes',
])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validateText(value, field, maxLength, { required = false } = {}) {
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (required && !normalized) throw createError(`${field} is required`, 400)
  if (normalized.length > maxLength) throw createError(`${field} is too long`, 400)
  return normalized
}

function sanitizePublicRequest(request) {
  return {
    id: request._id.toString(),
    bloodGroup: request.bloodGroup,
    quantity: request.quantity,
    unit: request.unit,
    hospitalName: request.hospitalName || '',
    division: request.division || '',
    district: request.district || '',
    upazila: request.upazila || '',
    requiredAt: request.requiredAt || null,
    urgency: request.urgency || 'STANDARD',
    status: request.status,
    verificationStatus: request.verificationStatus,
    createdAt: request.createdAt,
    contactPerson: request.contactPhoneConsent ? request.contactPerson || '' : '',
    contactPhone: request.contactPhoneConsent ? request.contactPhone || '' : '',
  }
}

function sanitizeOwnerRequest(request) {
  return {
    ...sanitizePublicRequest(request),
    requesterName: request.requesterName,
    verificationReason: request.verificationReason || '',
    updatedAt: request.updatedAt,
  }
}

async function createBloodRequest(requesterId, input) {
  if (!mongoose.isValidObjectId(requesterId)) throw createError('Please sign in again to submit a request', 401)
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A blood request object is required', 400)
  }
  for (const field of Object.keys(input)) {
    if (!INPUT_FIELDS.has(field)) throw createError(`Blood request field cannot be set: ${field}`, 400)
  }

  const user = await User.findById(requesterId).select('name accountStatus').lean()
  if (!user || user.accountStatus !== 'ACTIVE') throw createError('An active patient account is required', 403)

  if (typeof input.bloodGroup !== 'string' || !BLOOD_GROUPS.has(input.bloodGroup)) {
    throw createError('A valid blood group is required', 400)
  }
  const quantity = Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw createError('Quantity must be an integer between 1 and 20', 400)
  }
  const hospitalName = validateText(input.hospitalName, 'Hospital', 160, { required: true })
  const division = input.division === undefined ? '' : validateText(input.division, 'Division', 100)
  const district = input.district === undefined ? '' : validateText(input.district, 'District', 120)
  const upazila = input.upazila === undefined ? '' : validateText(input.upazila, 'Upazila', 120)
  const urgency = input.urgency === undefined ? 'STANDARD' : input.urgency
  if (typeof urgency !== 'string' || !URGENCY_VALUES.has(urgency)) {
    throw createError('A valid urgency is required', 400)
  }

  let requiredAt
  if (input.requiredAt !== undefined && input.requiredAt !== '') {
    requiredAt = new Date(input.requiredAt)
    if (Number.isNaN(requiredAt.getTime())) throw createError('A valid required date and time is required', 400)
  }

  const contactPhoneConsent = input.contactPhoneConsent === undefined ? false : input.contactPhoneConsent
  if (typeof contactPhoneConsent !== 'boolean') throw createError('Contact phone consent must be true or false', 400)
  let contactPerson = ''
  let contactPhone = ''
  if (contactPhoneConsent) {
    contactPerson = validateText(input.contactPerson, 'Contact person', 100, { required: true })
    contactPhone = validateText(input.contactPhone, 'Contact phone', 30, { required: true })
    if (!/^\+?[0-9\s().-]{7,30}$/.test(contactPhone)) throw createError('A valid contact phone number is required', 400)
  }

  const requestNotes = input.notes === undefined ? '' : validateText(input.notes, 'Notes', 500)
  const request = await BloodRequest.create({
    requesterId,
    requesterName: user.name,
    bloodGroup: input.bloodGroup,
    quantity,
    unit: 'units',
    hospitalName,
    division,
    district,
    upazila,
    requiredAt,
    urgency,
    contactPerson,
    contactPhone,
    contactPhoneConsent,
    requestNotes,
    status: 'PENDING',
    verificationStatus: 'PENDING',
  })

  await AdminAuditLog.create({
    actorId: requesterId,
    actorRole: 'PATIENT',
    action: 'BLOOD_REQUEST_CREATED',
    entityType: 'BloodRequest',
    entityId: request._id,
    result: 'SUCCESS',
    details: { bloodGroup: request.bloodGroup, division, district, upazila },
  })
  return sanitizeOwnerRequest(request)
}

function parsePublicQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw createError('A blood request query is required', 400)
  }
  for (const field of Object.keys(query)) {
    if (!QUERY_FIELDS.has(field)) throw createError(`Unsupported blood request filter: ${field}`, 400)
  }
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createError('Limit must be an integer between 1 and 100', 400)
  }
  if (query.bloodGroup !== undefined && query.bloodGroup !== '' && !BLOOD_GROUPS.has(query.bloodGroup)) {
    throw createError('Invalid blood group filter', 400)
  }
  const search = query.search === undefined ? '' : validateText(query.search, 'Search', 120)
  const location = query.location === undefined ? '' : validateText(query.location, 'Location', 120)
  return { page, limit, bloodGroup: query.bloodGroup || '', search, location }
}

async function getPublicBloodRequests(query = {}) {
  const { page, limit, bloodGroup, search, location } = parsePublicQuery(query)
  const filter = { status: 'ACTIVE', verificationStatus: 'VERIFIED' }
  if (bloodGroup) filter.bloodGroup = bloodGroup
  const conditions = []
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { hospitalName: pattern },
      { bloodGroup: pattern },
      { division: pattern },
      { district: pattern },
      { upazila: pattern },
    ] })
  }
  if (location) {
    const pattern = { $regex: escapeRegex(location), $options: 'i' }
    conditions.push({ $or: [{ division: pattern }, { district: pattern }, { upazila: pattern }] })
  }
  if (conditions.length) filter.$and = conditions

  const [requests, total] = await Promise.all([
    BloodRequest.find(filter).sort({ requiredAt: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    BloodRequest.countDocuments(filter),
  ])
  return {
    requests: requests.map(sanitizePublicRequest),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getPublicBloodRequestById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Blood request not found', 404)
  const request = await BloodRequest.findOne({
    _id: id,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
  }).lean()
  if (!request) throw createError('Blood request not found', 404)
  return sanitizePublicRequest(request)
}

async function getMyBloodRequests(requesterId) {
  if (!mongoose.isValidObjectId(requesterId)) throw createError('Please sign in again to view your requests', 401)
  const requests = await BloodRequest.find({ requesterId }).sort({ createdAt: -1 }).lean()
  return { requests: requests.map(sanitizeOwnerRequest) }
}

async function reportPublicBloodRequest(id, reporterId, input) {
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reporterId)) {
    throw createError('Blood request not found', 404)
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A report reason is required', 400)
  }
  for (const field of Object.keys(input)) {
    if (field !== 'reason') throw createError(`Report field cannot be set: ${field}`, 400)
  }
  const reason = validateText(input.reason, 'Report reason', 500, { required: true })
  const request = await BloodRequest.findOne({
    _id: id,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
  })
  if (!request) throw createError('Blood request not found', 404)
  if ((request.reports || []).some((report) => report.reporterId.toString() === reporterId)) {
    throw createError('You have already reported this request', 409)
  }
  if (!Array.isArray(request.reports)) request.reports = []
  request.reports.push({ reporterId, reason, createdAt: new Date() })
  request.reportReason = reason
  request.reportedAt = new Date()
  await request.save()
  await AdminAuditLog.create({
    actorId: reporterId,
    actorRole: 'PATIENT',
    action: 'BLOOD_REQUEST_REPORTED',
    entityType: 'BloodRequest',
    entityId: request._id,
    result: 'SUCCESS',
    details: { reason },
  })
  return { id: request._id.toString(), reportedAt: request.reportedAt }
}

module.exports = {
  createBloodRequest,
  getPublicBloodRequests,
  getPublicBloodRequestById,
  getMyBloodRequests,
  reportPublicBloodRequest,
}

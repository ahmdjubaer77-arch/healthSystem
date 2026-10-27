const mongoose = require('mongoose')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')

const PHARMACY_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
const EDITABLE_FIELDS = new Set([
  'name', 'contactEmail', 'contactPhone', 'address', 'division', 'district', 'upazila',
  'registrationNumber', 'licenseNumber',
])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validatePagination(page, limit) {
  const parsedPage = page === undefined ? 1 : Number(page)
  const parsedLimit = limit === undefined ? 20 : Number(limit)
  if (!Number.isInteger(parsedPage) || parsedPage < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw createError('Limit must be an integer between 1 and 100', 400)
  }
  return { page: parsedPage, limit: parsedLimit }
}

function normalizeText(value, field, maxLength, required = false) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (required && !normalized) throw createError(`${field} is required`, 400)
  if (normalized.length > maxLength) throw createError(`${field} is too long`, 400)
  return normalized
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

function validatePharmacyInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A pharmacy object is required', 400)
  }

  for (const field of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(field)) throw createError(`Pharmacy field cannot be changed: ${field}`, 400)
  }

  const pharmacy = {}
  const definitions = {
    name: [160, !partial],
    contactEmail: [160, false],
    contactPhone: [30, false],
    address: [240, !partial],
    division: [100, false],
    district: [120, false],
    upazila: [120, false],
    registrationNumber: [120, false],
    licenseNumber: [120, false],
  }

  for (const [field, [maxLength, required]] of Object.entries(definitions)) {
    if (input[field] !== undefined || required) {
      pharmacy[field] = normalizeText(input[field], field, maxLength, required)
    }
  }

  if (pharmacy.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pharmacy.contactEmail)) {
    throw createError('A valid contact email is required', 400)
  }
  if (partial && Object.keys(pharmacy).length === 0) throw createError('At least one pharmacy field is required', 400)
  return pharmacy
}

function buildPharmacyResponse(pharmacy) {
  return {
    id: pharmacy._id.toString(),
    name: pharmacy.name,
    providerType: 'Pharmacy',
    contactEmail: pharmacy.contactEmail || '',
    contactPhone: pharmacy.contactPhone || '',
    address: pharmacy.address || '',
    division: pharmacy.division || '',
    district: pharmacy.district || '',
    upazila: pharmacy.upazila || '',
    registrationNumber: pharmacy.registrationNumber || '',
    licenseNumber: pharmacy.licenseNumber || '',
    verificationStatus: pharmacy.verificationStatus,
    verificationReason: pharmacy.verificationReason || '',
    verifiedAt: pharmacy.verifiedAt || null,
    suspendedAt: pharmacy.suspendedAt || null,
    createdAt: pharmacy.createdAt,
    updatedAt: pharmacy.updatedAt,
  }
}

function addLocationFilter(filter, location) {
  if (location === undefined || location === '') return
  if (typeof location !== 'string') throw createError('Location filter must be a string', 400)
  const normalized = location.trim()
  if (normalized.length > 120) throw createError('Location filter is too long', 400)
  if (!normalized) return
  const pattern = { $regex: escapeRegex(normalized), $options: 'i' }
  filter.$and = [...(filter.$and || []), { $or: [
    { address: pattern }, { division: pattern }, { district: pattern }, { upazila: pattern },
  ] }]
}

async function getPharmacies(query = {}) {
  validateObjectInput(query, new Set(['page', 'limit', 'verificationStatus', 'location', 'search']), 'Pharmacy query')
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = { providerType: 'Pharmacy' }

  if (query.verificationStatus !== undefined && query.verificationStatus !== '') {
    if (!PHARMACY_STATUSES.has(query.verificationStatus)) throw createError('Invalid verification status filter', 400)
    filter.verificationStatus = query.verificationStatus
  }
  addLocationFilter(filter, query.location)

  if (query.search !== undefined && query.search !== '') {
    if (typeof query.search !== 'string') throw createError('Search must be a string', 400)
    const search = query.search.trim()
    if (search.length > 120) throw createError('Search is too long', 400)
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' }
      filter.$and = [...(filter.$and || []), { $or: [
        { name: pattern }, { contactEmail: pattern }, { contactPhone: pattern },
        { address: pattern }, { registrationNumber: pattern }, { licenseNumber: pattern },
      ] }]
    }
  }

  const [pharmacies, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])
  return {
    pharmacies: pharmacies.map(buildPharmacyResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getPharmacyById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Pharmacy not found', 404)
  const pharmacy = await Provider.findOne({ _id: id, providerType: 'Pharmacy' }).lean()
  if (!pharmacy) throw createError('Pharmacy not found', 404)
  return buildPharmacyResponse(pharmacy)
}

async function writeAudit(actor, pharmacy, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `pharmacy.${action}`,
    entityType: 'Provider',
    entityId: pharmacy._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

async function createPharmacy(input, actor) {
  const data = validatePharmacyInput(input)
  const pharmacy = await Provider.create({ ...data, providerType: 'Pharmacy', verificationStatus: 'PENDING' })
  await writeAudit(actor, pharmacy, 'created', { providerType: 'Pharmacy' })
  return buildPharmacyResponse(pharmacy)
}

async function updatePharmacy(id, input, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('Pharmacy not found', 404)
  const updates = validatePharmacyInput(input, { partial: true })
  const pharmacy = await Provider.findOne({ _id: id, providerType: 'Pharmacy' })
  if (!pharmacy) throw createError('Pharmacy not found', 404)
  for (const [field, value] of Object.entries(updates)) pharmacy.set(field, value)
  await pharmacy.save()
  await writeAudit(actor, pharmacy, 'updated', { fields: Object.keys(updates) })
  return buildPharmacyResponse(pharmacy)
}

async function updatePharmacyVerification(id, input, actor) {
  validateObjectInput(input, new Set(['status', 'reason']), 'Pharmacy verification')
  const { status, reason } = input
  if (reason !== undefined && typeof reason !== 'string') throw createError('Rejection reason must be a string', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Pharmacy not found', 404)
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw createError('Invalid verification status', 400)
  const normalizedReason = typeof reason === 'string' ? reason.trim() : ''
  if (status === 'REJECTED' && !normalizedReason) throw createError('A rejection reason is required', 400)
  if (normalizedReason.length > 500) throw createError('Rejection reason is too long', 400)

  const pharmacy = await Provider.findOne({ _id: id, providerType: 'Pharmacy' })
  if (!pharmacy) throw createError('Pharmacy not found', 404)
  if (pharmacy.verificationStatus === 'SUSPENDED') {
    throw createError('Restore the pharmacy before changing its verification status', 409)
  }
  if (pharmacy.verificationStatus === status) throw createError(`Pharmacy is already ${status}`, 409)

  const previousStatus = pharmacy.verificationStatus
  const previousReason = pharmacy.verificationReason || ''
  pharmacy.verificationStatus = status
  pharmacy.verificationReason = status === 'REJECTED' ? normalizedReason : ''
  pharmacy.verifiedAt = status === 'VERIFIED' ? new Date() : null
  pharmacy.suspendedAt = null
  await pharmacy.save()
  await writeAudit(actor, pharmacy, status === 'VERIFIED' ? 'verified' : 'rejected', {
    previousStatus,
    nextStatus: status,
    previousReason,
    nextReason: pharmacy.verificationReason,
  })
  return buildPharmacyResponse(pharmacy)
}

async function updatePharmacyStatus(id, input, actor) {
  validateObjectInput(input, new Set(['status']), 'Pharmacy status')
  const { status } = input
  if (!mongoose.isValidObjectId(id)) throw createError('Pharmacy not found', 404)
  if (!['SUSPENDED', 'RESTORE'].includes(status)) throw createError('Invalid pharmacy status action', 400)
  const pharmacy = await Provider.findOne({ _id: id, providerType: 'Pharmacy' })
  if (!pharmacy) throw createError('Pharmacy not found', 404)

  if (status === 'SUSPENDED') {
    if (pharmacy.verificationStatus === 'SUSPENDED') throw createError('Pharmacy is already suspended', 409)
    const previousStatus = pharmacy.verificationStatus
    pharmacy.verificationStatus = 'SUSPENDED'
    pharmacy.suspendedAt = new Date()
    pharmacy.verifiedAt = null
    await pharmacy.save()
    await writeAudit(actor, pharmacy, 'suspended', { previousStatus, nextStatus: 'SUSPENDED' })
  } else {
    if (pharmacy.verificationStatus !== 'SUSPENDED') throw createError('Only suspended pharmacies can be restored', 409)
    pharmacy.verificationStatus = 'VERIFIED'
    pharmacy.suspendedAt = null
    pharmacy.verifiedAt = new Date()
    pharmacy.verificationReason = ''
    await pharmacy.save()
    await writeAudit(actor, pharmacy, 'restored', { previousStatus: 'SUSPENDED', nextStatus: 'VERIFIED' })
  }

  return buildPharmacyResponse(pharmacy)
}

module.exports = {
  getPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  updatePharmacyVerification,
  updatePharmacyStatus,
}
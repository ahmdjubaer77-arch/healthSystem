const mongoose = require('mongoose')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')

const HOSPITAL_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
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
  const parsedPage = Number.parseInt(page, 10)
  const parsedLimit = Number.parseInt(limit, 10)
  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20,
  }
}

function normalizeText(value, field, maxLength, required = false) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (required && !normalized) throw createError(`${field} is required`, 400)
  if (normalized.length > maxLength) throw createError(`${field} is too long`, 400)
  return normalized
}

function validateHospitalInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A hospital object is required', 400)
  }

  for (const field of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(field)) throw createError(`Hospital field cannot be changed: ${field}`, 400)
  }

  const hospital = {}
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
      hospital[field] = normalizeText(input[field], field, maxLength, required)
    }
  }

  if (hospital.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hospital.contactEmail)) {
    throw createError('A valid contact email is required', 400)
  }

  if (partial && Object.keys(hospital).length === 0) {
    throw createError('At least one hospital field is required', 400)
  }

  return hospital
}

function buildHospitalResponse(hospital) {
  return {
    id: hospital._id.toString(),
    name: hospital.name,
    providerType: hospital.providerType,
    contactEmail: hospital.contactEmail || '',
    contactPhone: hospital.contactPhone || '',
    address: hospital.address || '',
    division: hospital.division || '',
    district: hospital.district || '',
    upazila: hospital.upazila || '',
    registrationNumber: hospital.registrationNumber || '',
    licenseNumber: hospital.licenseNumber || '',
    verificationStatus: hospital.verificationStatus,
    verificationReason: hospital.verificationReason || '',
    verifiedAt: hospital.verifiedAt || null,
    suspendedAt: hospital.suspendedAt || null,
    createdAt: hospital.createdAt,
    updatedAt: hospital.updatedAt,
  }
}

function addTextFilter(filter, field, value) {
  if (typeof value !== 'string' || !value.trim()) return
  if (value.length > 120) throw createError(`${field} filter is too long`, 400)
  filter[field] = { $regex: escapeRegex(value.trim()), $options: 'i' }
}

async function getHospitals(query = {}) {
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = { providerType: 'Hospital' }

  if (query.verificationStatus) {
    if (!HOSPITAL_STATUSES.has(query.verificationStatus)) {
      throw createError('Invalid verification status filter', 400)
    }
    filter.verificationStatus = query.verificationStatus
  }

  addTextFilter(filter, 'division', query.division)
  addTextFilter(filter, 'district', query.district)
  addTextFilter(filter, 'upazila', query.upazila)

  if (typeof query.search === 'string' && query.search.trim()) {
    if (query.search.length > 120) throw createError('Search is too long', 400)
    const pattern = { $regex: escapeRegex(query.search.trim()), $options: 'i' }
    filter.$or = [
      { name: pattern },
      { contactEmail: pattern },
      { contactPhone: pattern },
      { address: pattern },
      { registrationNumber: pattern },
      { licenseNumber: pattern },
    ]
  }

  const [hospitals, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])

  return {
    hospitals: hospitals.map(buildHospitalResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getHospitalById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Hospital not found', 404)
  const hospital = await Provider.findOne({ _id: id, providerType: 'Hospital' }).lean()
  if (!hospital) throw createError('Hospital not found', 404)
  return buildHospitalResponse(hospital)
}

async function writeAudit(actor, hospital, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `hospital.${action}`,
    entityType: 'Provider',
    entityId: hospital._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

async function createHospital(input, actor) {
  const data = validateHospitalInput(input)
  const hospital = await Provider.create({
    ...data,
    providerType: 'Hospital',
    verificationStatus: 'PENDING',
  })
  await writeAudit(actor, hospital, 'created', { providerType: 'Hospital' })
  return buildHospitalResponse(hospital)
}

async function updateHospital(id, input, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('Hospital not found', 404)
  const updates = validateHospitalInput(input, { partial: true })
  const hospital = await Provider.findOne({ _id: id, providerType: 'Hospital' })
  if (!hospital) throw createError('Hospital not found', 404)

  for (const [field, value] of Object.entries(updates)) hospital.set(field, value)
  await hospital.save()
  await writeAudit(actor, hospital, 'updated', { fields: Object.keys(updates) })
  return buildHospitalResponse(hospital)
}

async function updateHospitalVerification(id, status, reason, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('Hospital not found', 404)
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw createError('Invalid verification status', 400)
  const normalizedReason = typeof reason === 'string' ? reason.trim() : ''
  if (status === 'REJECTED' && !normalizedReason) throw createError('A rejection reason is required', 400)
  if (normalizedReason.length > 500) throw createError('Rejection reason is too long', 400)

  const hospital = await Provider.findOne({ _id: id, providerType: 'Hospital' })
  if (!hospital) throw createError('Hospital not found', 404)
  if (hospital.verificationStatus === 'SUSPENDED') {
    throw createError('Restore the hospital before changing its verification status', 409)
  }
  if (hospital.verificationStatus === status) throw createError(`Hospital is already ${status}`, 409)

  const previousStatus = hospital.verificationStatus
  const previousReason = hospital.verificationReason || ''
  hospital.verificationStatus = status
  hospital.verificationReason = status === 'REJECTED' ? normalizedReason : ''
  hospital.verifiedAt = status === 'VERIFIED' ? new Date() : null
  hospital.suspendedAt = null
  await hospital.save()
  await writeAudit(actor, hospital, status === 'VERIFIED' ? 'verified' : 'rejected', {
    previousStatus,
    nextStatus: status,
    previousReason,
    nextReason: hospital.verificationReason,
  })
  return buildHospitalResponse(hospital)
}

async function updateHospitalStatus(id, status, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('Hospital not found', 404)
  if (!['SUSPENDED', 'RESTORE'].includes(status)) throw createError('Invalid hospital status action', 400)

  const hospital = await Provider.findOne({ _id: id, providerType: 'Hospital' })
  if (!hospital) throw createError('Hospital not found', 404)
  if (status === 'SUSPENDED') {
    if (hospital.verificationStatus === 'SUSPENDED') throw createError('Hospital is already suspended', 409)
    const previousStatus = hospital.verificationStatus
    hospital.verificationStatus = 'SUSPENDED'
    hospital.suspendedAt = new Date()
    hospital.verifiedAt = null
    await hospital.save()
    await writeAudit(actor, hospital, 'suspended', { previousStatus, nextStatus: 'SUSPENDED' })
  } else {
    if (hospital.verificationStatus !== 'SUSPENDED') throw createError('Only suspended hospitals can be restored', 409)
    hospital.verificationStatus = 'VERIFIED'
    hospital.suspendedAt = null
    hospital.verifiedAt = new Date()
    hospital.verificationReason = ''
    await hospital.save()
    await writeAudit(actor, hospital, 'restored', { previousStatus: 'SUSPENDED', nextStatus: 'VERIFIED' })
  }

  return buildHospitalResponse(hospital)
}

module.exports = {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  updateHospitalVerification,
  updateHospitalStatus,
}

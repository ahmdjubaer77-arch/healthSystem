const mongoose = require('mongoose')
const path = require('node:path')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')
const { cloudinary, ensureCloudinaryConfigured } = require('../config/cloudinary')

const DOCTOR_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
const DOCTOR_QUERY_FIELDS = new Set(['page', 'limit', 'search', 'specialty', 'verificationStatus', 'location'])

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

function validatePagination(page, limit) {
  const parsedPage = page === undefined ? 1 : Number(page)
  const parsedLimit = limit === undefined ? 20 : Number(limit)
  if (!Number.isInteger(parsedPage) || parsedPage < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw createError('Limit must be an integer between 1 and 100', 400)
  }
  return { page: parsedPage, limit: parsedLimit }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addTextCondition(conditions, field, value, label) {
  if (value === undefined || value === '') return
  if (typeof value !== 'string') throw createError(`${label} must be a string`, 400)
  const normalized = value.trim()
  if (normalized.length > 120) throw createError(`${label} is too long`, 400)
  if (normalized) conditions.push({ [field]: { $regex: escapeRegex(normalized), $options: 'i' } })
}

function normalizeQueryText(value, label) {
  if (value === undefined || value === '') return ''
  if (typeof value !== 'string') throw createError(`${label} must be a string`, 400)
  const normalized = value.trim()
  if (normalized.length > 120) throw createError(`${label} is too long`, 400)
  return normalized
}

function buildDoctorResponse(doctor, includeCredentials = false) {
  const response = {
    id: doctor._id.toString(),
    name: doctor.name,
    providerType: 'Doctor',
    specialty: doctor.specialty || '',
    contactEmail: doctor.contactEmail || '',
    contactPhone: doctor.contactPhone || '',
    address: doctor.address || '',
    division: doctor.division || '',
    district: doctor.district || '',
    upazila: doctor.upazila || '',
    registrationNumber: doctor.registrationNumber || '',
    licenseNumber: doctor.licenseNumber || '',
    verificationStatus: doctor.verificationStatus,
    verificationReason: doctor.verificationReason || '',
    verifiedAt: doctor.verifiedAt || null,
    suspendedAt: doctor.suspendedAt || null,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
       qualification: doctor.qualification || '',
       experienceYears: doctor.experienceYears ?? null,
       hospitalName: doctor.hospitalName || '',
       consultationFee: doctor.consultationFee ?? null,
       availability: doctor.operationalStatus || 'OFFLINE',
  }
  if (includeCredentials) {
    response.submittedCredentials = (doctor.submittedDocuments || []).map((document) => ({
      id: document._id.toString(),
      documentType: document.documentType,
      fileName: document.fileName,
      uploadedAt: document.uploadedAt,
    }))
  } else {
    response.credentialCount = (doctor.submittedDocuments || []).length
  }
  return response
}

async function getDoctors(query = {}) {
  validateObjectInput(query, DOCTOR_QUERY_FIELDS, 'Doctor query')
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = { providerType: 'Doctor' }

  if (query.verificationStatus !== undefined && query.verificationStatus !== '') {
    if (!DOCTOR_STATUSES.has(query.verificationStatus)) throw createError('Invalid verification status filter', 400)
    filter.verificationStatus = query.verificationStatus
  }

  const conditions = []
  addTextCondition(conditions, 'specialty', query.specialty, 'Specialty filter')
  const search = normalizeQueryText(query.search, 'Search')
  const location = normalizeQueryText(query.location, 'Location filter')

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { name: pattern }, { contactEmail: pattern }, { contactPhone: pattern },
      { address: pattern }, { registrationNumber: pattern }, { licenseNumber: pattern },
      { specialty: pattern },
         { hospitalName: pattern },
    ] })
  }
  if (location) {
    const pattern = { $regex: escapeRegex(location), $options: 'i' }
    conditions.push({ $or: [
      { address: pattern }, { division: pattern }, { district: pattern }, { upazila: pattern },
    ] })
  }
  if (conditions.length) filter.$and = conditions

  const [doctors, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])
  return {
    doctors: doctors.map((doctor) => buildDoctorResponse(doctor)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getDoctorById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Doctor not found', 404)
  const doctor = await Provider.findOne({ _id: id, providerType: 'Doctor' }).lean()
  if (!doctor) throw createError('Doctor not found', 404)
  return buildDoctorResponse(doctor, true)
}

async function writeAudit(actor, doctor, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `doctor.${action}`,
    entityType: 'Provider',
    entityId: doctor._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

function validateDoctorProfile(input, partial = false) {
  const fields = new Set([
    'name', 'specialty', 'qualification', 'registrationNumber', 'experienceYears',
    'hospitalName', 'consultationFee', 'division', 'district', 'upazila',
    'contactPhone', 'operationalStatus',
  ])
  validateObjectInput(input, fields, 'Doctor profile')
  const data = {}
  const textFields = [
    ['name', 'Full name', 160], ['specialty', 'Specialty', 120],
    ['qualification', 'Qualification', 240], ['registrationNumber', 'BMDC registration number', 120],
    ['hospitalName', 'Hospital or clinic', 160], ['division', 'Division', 100],
    ['district', 'District', 120], ['upazila', 'Upazila', 120],
    ['contactPhone', 'Public contact number', 30],
  ]
  for (const [field, label, maxLength] of textFields) {
    if (partial && input[field] === undefined) continue
    if (typeof input[field] !== 'string') throw createError(`${label} must be a string`, 400)
    const value = input[field].trim()
    if (!value || value.length > maxLength) throw createError(`${label} is required and must be at most ${maxLength} characters`, 400)
    data[field] = value
  }
  if (data.contactPhone && !/^\+?[0-9][0-9\s()-]{6,29}$/.test(data.contactPhone)) {
    throw createError('Public contact number is invalid', 400)
  }
  if (data.registrationNumber && !/^[A-Za-z0-9./ -]{3,120}$/.test(data.registrationNumber)) {
    throw createError('BMDC registration number is invalid', 400)
  }
  if (!partial || input.experienceYears !== undefined) {
    const experienceYears = Number(input.experienceYears)
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 80) {
      throw createError('Experience must be a whole number between 0 and 80', 400)
    }
    data.experienceYears = experienceYears
  }
  if (!partial || input.consultationFee !== undefined) {
    const consultationFee = Number(input.consultationFee)
    if (!Number.isFinite(consultationFee) || consultationFee < 0 || consultationFee > 1000000) {
      throw createError('Consultation fee must be between 0 and 1000000', 400)
    }
    data.consultationFee = consultationFee
  }
  if (!partial || input.operationalStatus !== undefined) {
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(input.operationalStatus)) {
      throw createError('Invalid doctor availability', 400)
    }
    data.operationalStatus = input.operationalStatus
  }
  return data
}

async function createDoctor(input, actor) {
  requirePermission(actor, 'doctors.verify')
  const data = validateDoctorProfile(input)
  const duplicate = await Provider.findOne({
    providerType: 'Doctor',
    registrationNumber: { $regex: `^${escapeRegex(data.registrationNumber)}$`, $options: 'i' },
  })
  if (duplicate) throw createError('A doctor with this BMDC registration number already exists', 409)
  const doctor = await Provider.create({ ...data, providerType: 'Doctor', verificationStatus: 'PENDING' })
  await writeAudit(actor, doctor, 'created', { specialty: doctor.specialty })
  return buildDoctorResponse(doctor, true)
}

async function updateDoctor(id, input, actor) {
  requirePermission(actor, 'doctors.verify')
  if (!mongoose.isValidObjectId(id)) throw createError('Doctor not found', 404)
  const data = validateDoctorProfile(input, true)
  if (!Object.keys(data).length) throw createError('At least one doctor profile field is required', 400)
  const doctor = await Provider.findOne({ _id: id, providerType: 'Doctor' })
  if (!doctor) throw createError('Doctor not found', 404)
  if (data.registrationNumber) {
    const duplicate = await Provider.findOne({
      providerType: 'Doctor',
      registrationNumber: { $regex: `^${escapeRegex(data.registrationNumber)}$`, $options: 'i' },
    })
    if (duplicate && duplicate._id.toString() !== doctor._id.toString()) {
      throw createError('A doctor with this BMDC registration number already exists', 409)
    }
  }
  for (const [field, value] of Object.entries(data)) doctor.set(field, value)
  await doctor.save()
  await writeAudit(actor, doctor, 'updated', { fields: Object.keys(data) })
  return buildDoctorResponse(doctor, true)
}

async function getDoctorCredentialUrl(id, credentialId, actor) {
  requirePermission(actor, 'doctors.read')
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(credentialId)) {
    throw createError('Doctor credential not found', 404)
  }
  const doctor = await Provider.findOne({ _id: id, providerType: 'Doctor' })
  if (!doctor) throw createError('Doctor not found', 404)
  const credential = (doctor.submittedDocuments || []).find((document) => document._id.toString() === credentialId)
  if (!credential || !credential.storageId) throw createError('Doctor credential not found', 404)

  ensureCloudinaryConfigured()
  const extension = path.extname(credential.fileName || '').slice(1).toLowerCase()
  if (extension && !/^[a-z0-9]{1,10}$/.test(extension)) throw createError('Credential file type is invalid', 400)
  const expiresAt = Math.floor(Date.now() / 1000) + 120
  const url = cloudinary.utils.private_download_url(credential.storageId, extension || undefined, {
    resource_type: 'raw',
    type: 'private',
    expires_at: expiresAt,
  })
  await writeAudit(actor, doctor, 'credential_viewed', {
    documentType: credential.documentType,
    fileName: credential.fileName,
    expiresAt,
  })
  return { url, expiresAt }
}

async function updateDoctorVerification(id, input, actor) {
  requirePermission(actor, 'doctors.verify')
  validateObjectInput(input, new Set(['status', 'reason']), 'Doctor verification')
  const { status, reason } = input
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw createError('Invalid verification status', 400)
  if (reason !== undefined && typeof reason !== 'string') throw createError('Rejection reason must be a string', 400)
  const normalizedReason = reason?.trim() || ''
  if (status === 'REJECTED' && !normalizedReason) throw createError('A rejection reason is required', 400)
  if (normalizedReason.length > 500) throw createError('Rejection reason is too long', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Doctor not found', 404)

  const doctor = await Provider.findOne({ _id: id, providerType: 'Doctor' })
  if (!doctor) throw createError('Doctor not found', 404)
  if (doctor.verificationStatus === 'SUSPENDED') throw createError('Restore the doctor before changing verification', 409)
  if (doctor.verificationStatus === status) throw createError(`Doctor is already ${status}`, 409)

  const previousStatus = doctor.verificationStatus
  const previousReason = doctor.verificationReason || ''
  doctor.verificationStatus = status
  doctor.verificationReason = status === 'REJECTED' ? normalizedReason : ''
  doctor.verifiedAt = status === 'VERIFIED' ? new Date() : null
  doctor.suspendedAt = null
  await doctor.save()
  await writeAudit(actor, doctor, status === 'VERIFIED' ? 'verified' : 'rejected', {
    previousStatus,
    nextStatus: status,
    previousReason,
    nextReason: doctor.verificationReason,
  })
  return buildDoctorResponse(doctor, true)
}

async function updateDoctorStatus(id, input, actor) {
  requirePermission(actor, 'doctors.verify')
  validateObjectInput(input, new Set(['status']), 'Doctor status')
  const { status } = input
  if (!['SUSPENDED', 'RESTORE'].includes(status)) throw createError('Invalid doctor status action', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Doctor not found', 404)
  const doctor = await Provider.findOne({ _id: id, providerType: 'Doctor' })
  if (!doctor) throw createError('Doctor not found', 404)

  if (status === 'SUSPENDED') {
    if (doctor.verificationStatus === 'SUSPENDED') throw createError('Doctor is already suspended', 409)
    const previousStatus = doctor.verificationStatus
    doctor.verificationStatus = 'SUSPENDED'
    doctor.suspendedAt = new Date()
    doctor.verifiedAt = null
    await doctor.save()
    await writeAudit(actor, doctor, 'suspended', { previousStatus, nextStatus: 'SUSPENDED' })
  } else {
    if (doctor.verificationStatus !== 'SUSPENDED') throw createError('Only suspended doctors can be restored', 409)
    doctor.verificationStatus = 'VERIFIED'
    doctor.suspendedAt = null
    doctor.verifiedAt = new Date()
    doctor.verificationReason = ''
    await doctor.save()
    await writeAudit(actor, doctor, 'restored', { previousStatus: 'SUSPENDED', nextStatus: 'VERIFIED' })
  }
  return buildDoctorResponse(doctor, true)
}

function buildPublicDoctorResponse(doctor) {
  return {
    id: doctor._id.toString(),
    name: doctor.name,
    specialty: doctor.specialty || '',
    qualification: doctor.qualification || '',
    registrationNumber: doctor.registrationNumber || '',
    experienceYears: doctor.experienceYears ?? null,
    hospitalName: doctor.hospitalName || '',
    consultationFee: doctor.consultationFee ?? null,
    division: doctor.division || '',
    district: doctor.district || '',
    upazila: doctor.upazila || '',
    contactPhone: doctor.contactPhone || '',
    availability: doctor.operationalStatus,
    verificationStatus: doctor.verificationStatus,
  }
}

async function getPublicDoctors(query = {}) {
  const fields = new Set(['page', 'limit', 'search', 'name', 'specialty', 'hospitalName', 'division', 'district', 'upazila', 'availability'])
  validateObjectInput(query, fields, 'Doctor directory query')
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = {
    providerType: 'Doctor',
    verificationStatus: 'VERIFIED',
    operationalStatus: query.availability || { $in: ['AVAILABLE', 'BUSY'] },
  }
  if (query.availability !== undefined && query.availability !== '' && !['AVAILABLE', 'BUSY'].includes(query.availability)) {
    throw createError('Invalid availability filter', 400)
  }
  const conditions = []
  const searchFields = [
    ['name', 'Name'], ['specialty', 'Specialty'], ['hospitalName', 'Hospital'],
    ['division', 'Division'], ['district', 'District'], ['upazila', 'Upazila'],
  ]
  const search = normalizeQueryText(query.search, 'Search')
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: searchFields.map(([field]) => ({ [field]: pattern })) })
  }
  for (const [field, label] of searchFields) {
    const value = normalizeQueryText(query[field], `${label} filter`)
    if (value) conditions.push({ [field]: { $regex: escapeRegex(value), $options: 'i' } })
  }
  if (conditions.length) filter.$and = conditions
  const [doctors, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])
  return {
    doctors: doctors.map(buildPublicDoctorResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getPublicDoctorById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Doctor not found', 404)
  const doctor = await Provider.findOne({
    _id: id,
    providerType: 'Doctor',
    verificationStatus: 'VERIFIED',
    operationalStatus: { $in: ['AVAILABLE', 'BUSY'] },
  }).lean()
  if (!doctor) throw createError('Doctor not found', 404)
  return buildPublicDoctorResponse(doctor)
}

module.exports = {
  getDoctors,
  getDoctorById,
  getPublicDoctors,
  getPublicDoctorById,
  createDoctor,
  updateDoctor,
  getDoctorCredentialUrl,
  updateDoctorVerification,
  updateDoctorStatus,
}
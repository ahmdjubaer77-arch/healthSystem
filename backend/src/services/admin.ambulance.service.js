const mongoose = require('mongoose')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')

const VERIFICATION_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
const OPERATIONAL_STATUSES = new Set(['AVAILABLE', 'BUSY', 'OFFLINE'])
const QUERY_FIELDS = new Set(['page', 'limit', 'search', 'verificationStatus', 'serviceArea', 'operationalStatus'])
const PUBLIC_OPERATIONAL_STATUSES = new Set(['AVAILABLE', 'BUSY'])

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

function normalizeQueryText(value, label) {
  if (value === undefined || value === '') return ''
  if (typeof value !== 'string') throw createError(`${label} must be a string`, 400)
  const normalized = value.trim()
  if (normalized.length > 120) throw createError(`${label} is too long`, 400)
  return normalized
}

function buildAmbulanceResponse(provider, includeVehicles = false) {
  const response = {
    id: provider._id.toString(),
    name: provider.name,
    providerType: 'Ambulance Provider',
    contactEmail: provider.contactEmail || '',
    contactPhone: provider.contactPhone || '',
    address: provider.address || '',
    division: provider.division || '',
    district: provider.district || '',
    upazila: provider.upazila || '',
    serviceAreas: (provider.serviceAreas || []).filter(Boolean),
    registrationNumber: provider.registrationNumber || '',
    licenseNumber: provider.licenseNumber || '',
    operationalStatus: provider.operationalStatus || 'OFFLINE',
    verificationStatus: provider.verificationStatus,
    verificationReason: provider.verificationReason || '',
    verifiedAt: provider.verifiedAt || null,
    suspendedAt: provider.suspendedAt || null,
    vehicleCount: (provider.vehicles || []).length,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  }
  if (includeVehicles) {
    response.vehicles = (provider.vehicles || []).map((vehicle) => ({
      vehicleType: vehicle.vehicleType || '',
      registrationNumber: vehicle.registrationNumber || '',
      capacity: vehicle.capacity || null,
      equipment: (vehicle.equipment || []).filter(Boolean),
    }))
  }
  return response
}

async function getAmbulances(query = {}) {
  validateObjectInput(query, QUERY_FIELDS, 'Ambulance query')
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = { providerType: 'Ambulance Provider' }

  if (query.verificationStatus !== undefined && query.verificationStatus !== '') {
    if (!VERIFICATION_STATUSES.has(query.verificationStatus)) throw createError('Invalid verification status filter', 400)
    filter.verificationStatus = query.verificationStatus
  }
  if (query.operationalStatus !== undefined && query.operationalStatus !== '') {
    if (!OPERATIONAL_STATUSES.has(query.operationalStatus)) throw createError('Invalid operational status filter', 400)
    filter.operationalStatus = query.operationalStatus
  }

  const search = normalizeQueryText(query.search, 'Search')
  const serviceArea = normalizeQueryText(query.serviceArea, 'Service area filter')
  const conditions = []
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { name: pattern }, { contactEmail: pattern }, { contactPhone: pattern },
      { address: pattern }, { registrationNumber: pattern }, { licenseNumber: pattern },
      { 'vehicles.vehicleType': pattern }, { 'vehicles.registrationNumber': pattern },
    ] })
  }
  if (serviceArea) {
    const pattern = { $regex: escapeRegex(serviceArea), $options: 'i' }
    conditions.push({ $or: [
      { serviceAreas: pattern }, { division: pattern }, { district: pattern },
      { upazila: pattern }, { address: pattern },
    ] })
  }
  if (conditions.length) filter.$and = conditions

  const [providers, total] = await Promise.all([
    Provider.find(filter).select('name contactPhone division district upazila serviceAreas operationalStatus verificationStatus vehicles.vehicleType createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])
  return {
    ambulances: providers.map((provider) => buildAmbulanceResponse(provider)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getAmbulanceById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)
  const provider = await Provider.findOne({ _id: id, providerType: 'Ambulance Provider' }).lean()
  if (!provider) throw createError('Ambulance provider not found', 404)
  return buildAmbulanceResponse(provider, true)
}

async function writeAudit(actor, provider, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `ambulance.${action}`,
    entityType: 'Provider',
    entityId: provider._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

function validateAmbulanceProfile(input, partial = false) {
  const allowedFields = new Set(['name', 'contactPhone', 'address', 'division', 'district', 'upazila', 'serviceAreas', 'vehicles'])
  validateObjectInput(input, allowedFields, 'Ambulance provider')
  const data = {}
  for (const [field, label, maxLength] of [
    ['name', 'Provider name', 160], ['division', 'Division', 100],
    ['district', 'District', 120], ['upazila', 'Upazila', 120],
  ]) {
    if (partial && input[field] === undefined) continue
    if (typeof input[field] !== 'string') throw createError(`${label} must be a string`, 400)
    const value = input[field].trim()
    if (!value || value.length > maxLength) throw createError(`${label} is required and must be at most ${maxLength} characters`, 400)
    data[field] = value
  }
  if (partial && input.contactPhone === undefined) {
  } else {
    if (typeof input.contactPhone !== 'string') throw createError('Public contact number must be a string', 400)
    const contactPhone = input.contactPhone.trim()
    const digits = contactPhone.replace(/\D/g, '')
    if (!/^\+?[0-9][0-9\s()-]*$/.test(contactPhone) || contactPhone.length > 30 || digits.length < 7 || digits.length > 15) {
      throw createError('A valid public contact number is required', 400)
    }
    data.contactPhone = contactPhone
  }
  if (input.address !== undefined) {
    if (typeof input.address !== 'string' || input.address.trim().length > 240) throw createError('Address must be a string up to 240 characters', 400)
    data.address = input.address.trim()
  }
  if (!partial || input.serviceAreas !== undefined) {
    if (!Array.isArray(input.serviceAreas) || input.serviceAreas.length < 1 || input.serviceAreas.length > 20) {
      throw createError('At least one and no more than 20 service areas are required', 400)
    }
    const serviceAreas = input.serviceAreas.map((area) => {
      if (typeof area !== 'string' || !area.trim() || area.trim().length > 120) {
        throw createError('Each service area must be a non-empty string up to 120 characters', 400)
      }
      return area.trim()
    })
    data.serviceAreas = [...new Set(serviceAreas)]
  }
  if (!partial || input.vehicles !== undefined) {
    if (!Array.isArray(input.vehicles) || input.vehicles.length < 1 || input.vehicles.length > 20) {
      throw createError('At least one and no more than 20 vehicles are required', 400)
    }
    const registrationNumbers = new Set()
    data.vehicles = input.vehicles.map((vehicle) => {
      validateObjectInput(vehicle, new Set(['vehicleType', 'registrationNumber', 'capacity', 'equipment']), 'Vehicle')
      const vehicleType = typeof vehicle.vehicleType === 'string' ? vehicle.vehicleType.trim() : ''
      const registrationNumber = typeof vehicle.registrationNumber === 'string' ? vehicle.registrationNumber.trim() : ''
      if (!vehicleType || vehicleType.length > 100) throw createError('Vehicle type is required and must be at most 100 characters', 400)
      if (!/^[A-Za-z0-9/ .-]{2,40}$/.test(registrationNumber)) throw createError('A valid vehicle registration number is required', 400)
      const normalizedRegistration = registrationNumber.toUpperCase()
      if (registrationNumbers.has(normalizedRegistration)) throw createError('Vehicle registration numbers must be unique', 400)
      registrationNumbers.add(normalizedRegistration)
      let capacity
      if (vehicle.capacity !== undefined && vehicle.capacity !== null && vehicle.capacity !== '') {
        capacity = Number(vehicle.capacity)
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw createError('Vehicle capacity must be a whole number between 1 and 100', 400)
      }
      const equipment = vehicle.equipment === undefined ? [] : vehicle.equipment
      if (!Array.isArray(equipment) || equipment.length > 30 || equipment.some((item) => typeof item !== 'string' || item.trim().length > 100)) {
        throw createError('Vehicle equipment must be a list of up to 30 strings', 400)
      }
      return { vehicleType, registrationNumber, ...(capacity === undefined ? {} : { capacity }), equipment: equipment.map((item) => item.trim()).filter(Boolean) }
    })
  }
  return data
}

async function ensureUniqueVehicleRegistrations(vehicles, providerId) {
  const registrationNumbers = vehicles.map((vehicle) => vehicle.registrationNumber)
  const existingProviders = await Provider.find({
    providerType: 'Ambulance Provider',
    'vehicles.registrationNumber': { $in: registrationNumbers },
  }).select('_id vehicles.registrationNumber').lean()
  const duplicate = existingProviders.some((provider) => provider._id.toString() !== providerId && (provider.vehicles || []).some((vehicle) => (
    registrationNumbers.some((registrationNumber) => registrationNumber.toLowerCase() === vehicle.registrationNumber?.toLowerCase())
  )))
  if (duplicate) throw createError('A vehicle with this registration number already exists', 409)
}

async function createAmbulance(input, actor) {
  requirePermission(actor, 'ambulances.update')
  const data = validateAmbulanceProfile(input)
  await ensureUniqueVehicleRegistrations(data.vehicles)
  const provider = await Provider.create({
    ...data,
    providerType: 'Ambulance Provider',
    verificationStatus: 'PENDING',
    operationalStatus: 'OFFLINE',
  })
  await writeAudit(actor, provider, 'created', { vehicleCount: data.vehicles.length })
  return buildAmbulanceResponse(provider, true)
}

async function updateAmbulance(id, input, actor) {
  requirePermission(actor, 'ambulances.update')
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)
  const data = validateAmbulanceProfile(input, true)
  if (!Object.keys(data).length) throw createError('At least one ambulance profile field is required', 400)
  const provider = await Provider.findOne({ _id: id, providerType: 'Ambulance Provider' })
  if (!provider) throw createError('Ambulance provider not found', 404)
  if (data.vehicles) await ensureUniqueVehicleRegistrations(data.vehicles, provider._id.toString())
  for (const [field, value] of Object.entries(data)) provider.set(field, value)
  await provider.save()
  await writeAudit(actor, provider, 'updated', { fields: Object.keys(data) })
  return buildAmbulanceResponse(provider, true)
}

async function updateAmbulanceVerification(id, input, actor) {
  requirePermission(actor, 'ambulances.verify')
  validateObjectInput(input, new Set(['status', 'reason']), 'Ambulance verification')
  const { status, reason } = input
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw createError('Invalid verification status', 400)
  if (reason !== undefined && typeof reason !== 'string') throw createError('Rejection reason must be a string', 400)
  const normalizedReason = reason?.trim() || ''
  if (status === 'REJECTED' && !normalizedReason) throw createError('A rejection reason is required', 400)
  if (normalizedReason.length > 500) throw createError('Rejection reason is too long', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)

  const provider = await Provider.findOne({ _id: id, providerType: 'Ambulance Provider' })
  if (!provider) throw createError('Ambulance provider not found', 404)
  if (provider.verificationStatus === 'SUSPENDED') throw createError('Restore the provider before changing verification', 409)
  if (provider.verificationStatus === status) throw createError(`Provider is already ${status}`, 409)

  const previousStatus = provider.verificationStatus
  const previousReason = provider.verificationReason || ''
  const previousOperationalStatus = provider.operationalStatus || 'OFFLINE'
  provider.verificationStatus = status
  provider.verificationReason = status === 'REJECTED' ? normalizedReason : ''
  provider.verifiedAt = status === 'VERIFIED' ? new Date() : null
  provider.suspendedAt = null
  if (status === 'REJECTED') provider.operationalStatus = 'OFFLINE'
  await provider.save()
  await writeAudit(actor, provider, status === 'VERIFIED' ? 'verified' : 'rejected', {
    previousStatus,
    nextStatus: status,
    previousReason,
    nextReason: provider.verificationReason,
    previousOperationalStatus,
    nextOperationalStatus: provider.operationalStatus || 'OFFLINE',
  })
  return buildAmbulanceResponse(provider, true)
}

async function updateAmbulanceStatus(id, input, actor) {
  requirePermission(actor, 'ambulances.verify')
  validateObjectInput(input, new Set(['status']), 'Ambulance status')
  const { status } = input
  if (!['SUSPENDED', 'RESTORE'].includes(status)) throw createError('Invalid provider status action', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)
  const provider = await Provider.findOne({ _id: id, providerType: 'Ambulance Provider' })
  if (!provider) throw createError('Ambulance provider not found', 404)

  if (status === 'SUSPENDED') {
    if (provider.verificationStatus === 'SUSPENDED') throw createError('Provider is already suspended', 409)
    const previousStatus = provider.verificationStatus
    const previousOperationalStatus = provider.operationalStatus || 'OFFLINE'
    provider.verificationStatus = 'SUSPENDED'
    provider.suspendedAt = new Date()
    provider.verifiedAt = null
    provider.operationalStatus = 'OFFLINE'
    await provider.save()
    await writeAudit(actor, provider, 'suspended', {
      previousStatus,
      nextStatus: 'SUSPENDED',
      previousOperationalStatus,
      nextOperationalStatus: 'OFFLINE',
    })
  } else {
    if (provider.verificationStatus !== 'SUSPENDED') throw createError('Only suspended providers can be restored', 409)
    provider.verificationStatus = 'VERIFIED'
    provider.suspendedAt = null
    provider.verifiedAt = new Date()
    provider.verificationReason = ''
    provider.operationalStatus = 'OFFLINE'
    await provider.save()
    await writeAudit(actor, provider, 'restored', {
      previousStatus: 'SUSPENDED',
      nextStatus: 'VERIFIED',
      nextOperationalStatus: 'OFFLINE',
    })
  }
  return buildAmbulanceResponse(provider, true)
}

async function updateAmbulanceOperationalStatus(id, input, actor) {
  requirePermission(actor, 'ambulances.update')
  validateObjectInput(input, new Set(['operationalStatus']), 'Ambulance operational status')
  const { operationalStatus } = input
  if (!OPERATIONAL_STATUSES.has(operationalStatus)) throw createError('Invalid operational status', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)
  const provider = await Provider.findOne({ _id: id, providerType: 'Ambulance Provider' })
  if (!provider) throw createError('Ambulance provider not found', 404)
  if (provider.verificationStatus === 'SUSPENDED') throw createError('Restore the provider before changing operational status', 409)
  if (operationalStatus !== 'OFFLINE' && provider.verificationStatus !== 'VERIFIED') {
    throw createError('Only verified providers can be marked available or busy', 409)
  }
  if ((provider.operationalStatus || 'OFFLINE') === operationalStatus) {
    throw createError(`Operational status is already ${operationalStatus}`, 409)
  }

  const previousStatus = provider.operationalStatus || 'OFFLINE'
  provider.operationalStatus = operationalStatus
  await provider.save()
  await writeAudit(actor, provider, 'operational_status_updated', {
    previousStatus,
    nextStatus: operationalStatus,
  })
  return buildAmbulanceResponse(provider, true)
}

function buildPublicAmbulanceResponse(provider) {
  return {
    id: provider._id.toString(),
    name: provider.name,
    contactPhone: provider.contactPhone,
    division: provider.division || '',
    district: provider.district || '',
    upazila: provider.upazila || '',
    serviceAreas: (provider.serviceAreas || []).filter(Boolean),
    operationalStatus: provider.operationalStatus,
    verificationStatus: provider.verificationStatus,
    vehicles: (provider.vehicles || []).map((vehicle) => ({ vehicleType: vehicle.vehicleType || '' })),
  }
}

function buildPublicFilter(query) {
  const fields = new Set(['page', 'limit', 'search', 'vehicleType', 'serviceArea', 'division', 'district', 'upazila', 'operationalStatus'])
  validateObjectInput(query, fields, 'Public ambulance query')
  const { page, limit } = validatePagination(query.page, query.limit)
  if (query.operationalStatus !== undefined && query.operationalStatus !== '' && !PUBLIC_OPERATIONAL_STATUSES.has(query.operationalStatus)) {
    throw createError('Invalid operational status filter', 400)
  }
  const filter = {
    providerType: 'Ambulance Provider',
    verificationStatus: 'VERIFIED',
    operationalStatus: query.operationalStatus || { $in: [...PUBLIC_OPERATIONAL_STATUSES] },
    contactPhone: { $regex: '^\\+?[0-9][0-9\\s()-]{6,29}$' },
  }
  const conditions = []
  const search = normalizeQueryText(query.search, 'Search')
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { name: pattern }, { serviceAreas: pattern }, { 'vehicles.vehicleType': pattern },
      { division: pattern }, { district: pattern }, { upazila: pattern },
    ] })
  }
  const vehicleType = normalizeQueryText(query.vehicleType, 'Vehicle type filter')
  if (vehicleType) conditions.push({ 'vehicles.vehicleType': { $regex: escapeRegex(vehicleType), $options: 'i' } })
  const serviceArea = normalizeQueryText(query.serviceArea, 'Service area filter')
  if (serviceArea) conditions.push({ serviceAreas: { $regex: escapeRegex(serviceArea), $options: 'i' } })
  for (const field of ['division', 'district', 'upazila']) {
    const value = normalizeQueryText(query[field], `${field} filter`)
    if (value) conditions.push({ [field]: { $regex: escapeRegex(value), $options: 'i' } })
  }
  if (conditions.length) filter.$and = conditions
  return { filter, page, limit }
}

async function getPublicAmbulances(query = {}) {
  const { filter, page, limit } = buildPublicFilter(query)
  const [providers, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])
  return {
    ambulances: providers.map(buildPublicAmbulanceResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getPublicAmbulanceById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Ambulance provider not found', 404)
  const { filter } = buildPublicFilter({})
  const provider = await Provider.findOne({ ...filter, _id: id }).select('name contactPhone division district upazila serviceAreas operationalStatus verificationStatus vehicles.vehicleType').lean()
  if (!provider) throw createError('Ambulance provider not found', 404)
  return buildPublicAmbulanceResponse(provider)
}

module.exports = {
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  getPublicAmbulances,
  getPublicAmbulanceById,
  updateAmbulanceVerification,
  updateAmbulanceStatus,
  updateAmbulanceOperationalStatus,
}
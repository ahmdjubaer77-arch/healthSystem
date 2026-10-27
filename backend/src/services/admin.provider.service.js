const mongoose = require('mongoose')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')

const PROVIDER_TYPES = Provider.PROVIDER_TYPES
const VERIFICATION_STATUSES = Provider.VERIFICATION_STATUSES

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildProviderResponse(provider) {
  return {
    id: provider._id.toString(),
    name: provider.name,
    providerType: provider.providerType,
    contactEmail: provider.contactEmail || null,
    contactPhone: provider.contactPhone || null,
    address: provider.address || null,
    division: provider.division || null,
    district: provider.district || null,
    upazila: provider.upazila || null,
    registrationNumber: provider.registrationNumber || null,
    licenseNumber: provider.licenseNumber || null,
    submittedDocuments: (provider.submittedDocuments || []).map((document) => ({
      documentType: document.documentType,
      fileName: document.fileName,
      uploadedAt: document.uploadedAt,
    })),
    verificationStatus: provider.verificationStatus,
    verificationReason: provider.verificationReason || null,
    verifiedAt: provider.verifiedAt || null,
    suspendedAt: provider.suspendedAt || null,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  }
}

function validatePagination(page, limit) {
  const parsedPage = Number.parseInt(page, 10)
  const parsedLimit = Number.parseInt(limit, 10)
  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 20,
  }
}

function buildDateFilter(startDate, endDate) {
  const filter = {}
  if (startDate) filter.$gte = new Date(startDate)
  if (endDate) filter.$lte = new Date(endDate)
  return filter
}

async function getProviders(query) {
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = {}

  if (query.providerType && PROVIDER_TYPES.includes(query.providerType)) filter.providerType = query.providerType
  if (query.verificationStatus && VERIFICATION_STATUSES.includes(query.verificationStatus)) {
    filter.verificationStatus = query.verificationStatus
  }
  if (query.division) filter.division = { $regex: query.division.trim(), $options: 'i' }
  if (query.district) filter.district = { $regex: query.district.trim(), $options: 'i' }
  if (query.upazila) filter.upazila = { $regex: query.upazila.trim(), $options: 'i' }
  if (query.createdFrom || query.createdTo) filter.createdAt = buildDateFilter(query.createdFrom, query.createdTo)
  if (query.search !== undefined && query.search !== '') {
    if (typeof query.search !== 'string') throw createError('Search must be a string', 400)
    const search = query.search.trim()
    if (search.length > 120) throw createError('Search is too long', 400)
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' }
      filter.$or = [
        { name: pattern },
        { contactEmail: pattern },
        { contactPhone: pattern },
        { registrationNumber: pattern },
        { licenseNumber: pattern },
      ]
    }
  }

  const [providers, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Provider.countDocuments(filter),
  ])

  return {
    providers: providers.map(buildProviderResponse),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getProviderById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Provider not found', 404)
  const provider = await Provider.findById(id).lean()
  if (!provider) throw createError('Provider not found', 404)
  return buildProviderResponse(provider)
}

async function updateProviderStatus(id, status, reason, actor) {
  if (!mongoose.isValidObjectId(id)) throw createError('Provider not found', 404)
  if (!VERIFICATION_STATUSES.includes(status)) throw createError('Invalid verification status', 400)

  const permissionByStatus = {
    UNDER_REVIEW: 'providers.verify',
    VERIFIED: 'providers.verify',
    REJECTED: 'providers.reject',
    SUSPENDED: 'providers.suspend',
  }
  if (!permissionByStatus[status] || !actor.permissions?.includes(permissionByStatus[status])) {
    throw createError('Insufficient permissions', 403)
  }

  const provider = await Provider.findById(id)
  if (!provider) throw createError('Provider not found', 404)
  if (provider.verificationStatus === status) {
    throw createError('Provider already has this verification status', 409)
  }
  if (provider.verificationStatus === 'PENDING' && status !== 'UNDER_REVIEW') {
    throw createError('New applications must first be placed under review', 409)
  }
  if (provider.verificationStatus === 'UNDER_REVIEW' && !['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
    throw createError('Invalid verification transition', 409)
  }
  if (provider.verificationStatus === 'VERIFIED' && status !== 'SUSPENDED') {
    throw createError('Verified providers cannot be changed to another status without suspension', 409)
  }
  if (provider.verificationStatus === 'SUSPENDED' && status !== 'UNDER_REVIEW' && status !== 'VERIFIED') {
    throw createError('Suspended providers must be restored to review or verified', 409)
  }

  const previousStatus = provider.verificationStatus
  const previousReason = provider.verificationReason
  provider.verificationStatus = status
  provider.verificationReason = status === 'REJECTED' ? reason?.trim() || 'Rejected by administrator' : ''
  provider.verifiedAt = status === 'VERIFIED' ? new Date() : null
  provider.suspendedAt = status === 'SUSPENDED' ? new Date() : null
  if (status !== 'SUSPENDED') provider.suspendedAt = null
  if (status !== 'VERIFIED') provider.verifiedAt = null
  await provider.save()

  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `provider.${status.toLowerCase()}`,
    entityType: 'Provider',
    entityId: provider._id,
    details: { previousStatus, nextStatus: status, previousReason, nextReason: provider.verificationReason },
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })

  return buildProviderResponse(provider)
}

module.exports = { getProviders, getProviderById, updateProviderStatus }

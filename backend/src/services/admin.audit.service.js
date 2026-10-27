const mongoose = require('mongoose')
const AdminAuditLog = require('../models/AdminAuditLog')
const User = require('../models/User')

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const ACTIONS = new Set([
  'user.suspend', 'user.activate', 'user.role.update',
  'provider.verify', 'provider.reject', 'provider.suspend',
  'provider.verified', 'provider.rejected', 'provider.under_review', 'provider.suspended',
  'doctor.verified', 'doctor.rejected', 'doctor.suspended', 'doctor.restored', 'doctor.credential_viewed',
  'hospital.created', 'hospital.updated', 'hospital.verified', 'hospital.rejected', 'hospital.suspended', 'hospital.restored',
  'pharmacy.created', 'pharmacy.updated', 'pharmacy.verified', 'pharmacy.rejected', 'pharmacy.suspended', 'pharmacy.restored',
  'ambulance.created', 'ambulance.updated', 'ambulance.verified', 'ambulance.rejected', 'ambulance.suspended', 'ambulance.restored', 'ambulance.operational_status_updated',
  'blood.request.update', 'blood.request.reported',
  'blood.request.pending', 'blood.request.active', 'blood.request.matched',
  'blood.request.fulfilled', 'blood.request.expired', 'blood.request.cancelled',
  'emergency.request.update', 'emergency.request.pending', 'emergency.request.in_progress',
  'emergency.request.resolved', 'emergency.request.cancelled',
  'DONOR_CREATED', 'DONOR_UPDATED', 'DONOR_AVAILABILITY_UPDATED', 'DONOR_VERIFIED', 'DONOR_REJECTED', 'DONOR_SUSPENDED', 'DONOR_RESTORED',
  'BLOOD_REQUEST_STATUS_UPDATED', 'BLOOD_REQUEST_FLAGGED',
  'complaint.assigned', 'complaint.unassigned', 'complaint.note_added',
  'complaint.status_updated', 'complaint.resolved', 'complaint.rejected', 'complaint.escalated',
  'admin.created', 'system.settings.updated',
  'login', 'logout',
])
const RESOURCE_TYPES = new Set([
  'User', 'Provider', 'BloodRequest', 'EmergencyRequest', 'Complaint', 'HealthDocument', 'System',
])
const STATUSES = new Set(['SUCCESS', 'FAILURE', 'PENDING'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function buildDateFilter(from, to) {
  const filter = {}
  const start = from ? new Date(from) : null
  const end = to ? new Date(to) : null
  if (start && !Number.isNaN(start.getTime())) filter.$gte = start
  if (end && !Number.isNaN(end.getTime())) filter.$lte = end
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

function normalizeFilters(query) {
  const filters = {}
  if (query.actor && mongoose.isValidObjectId(query.actor)) filters.actorId = query.actor
  if (query.action && typeof query.action === 'string' && query.action.length <= 100 && ACTIONS.has(query.action)) filters.action = query.action
  if (query.resourceType && RESOURCE_TYPES.has(query.resourceType)) filters.entityType = query.resourceType
  if (query.status && STATUSES.has(query.status)) filters.result = query.status
  if (query.startDate || query.endDate) {
    const dateFilter = buildDateFilter(query.startDate, query.endDate)
    if (Object.keys(dateFilter).length) filters.createdAt = dateFilter
  }
  return filters
}

function buildAuditResponse(entry) {
  const actorId = entry.actorId?._id || entry.actorId
  return {
    id: entry._id.toString(),
    actor: entry.actorId?.name || (actorId ? actorId.toString() : null),
    actorId: actorId ? actorId.toString() : null,
    actorRole: entry.actorRole,
    action: entry.action,
    resourceType: entry.entityType,
    resourceId: entry.entityId.toString(),
    targetUser: entry.targetUser || null,
    timestamp: entry.createdAt,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    result: entry.result || 'SUCCESS',
    status: entry.result || 'SUCCESS',
    details: entry.details,
  }
}

async function getAuditLogs(query) {
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = normalizeFilters(query)
  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .populate('actorId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ])

  return {
    logs: logs.map(buildAuditResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

async function getAuditLogOptions() {
  const admins = await User.find({ role: { $in: [...ADMIN_ROLES] }, accountStatus: 'ACTIVE' })
    .select('name role')
    .sort({ name: 1 })
    .lean()
  return {
    actions: [...ACTIONS],
    resourceTypes: [...RESOURCE_TYPES],
    statuses: [...STATUSES],
    adminRoles: [...ADMIN_ROLES],
    admins: admins.map((admin) => ({ id: admin._id.toString(), name: admin.name, role: admin.role })),
  }
}

module.exports = { getAuditLogs, getAuditLogOptions }

const mongoose = require('mongoose')
const Complaint = require('../models/Complaint')
const User = require('../models/User')
const AdminAuditLog = require('../models/AdminAuditLog')

const STATUSES = new Set(Complaint.COMPLAINT_STATUSES)
const PRIORITIES = new Set(Complaint.COMPLAINT_PRIORITIES)
const QUERY_FIELDS = new Set(['page', 'limit', 'search', 'status', 'priority', 'category'])

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

function normalizeText(value, field, maxLength, required = false, minimum = 0) {
  if (value === undefined && !required) return ''
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (required && normalized.length < minimum) throw createError(`${field} must be at least ${minimum} characters`, 400)
  if (normalized.length > maxLength) throw createError(`${field} is too long`, 400)
  return normalized
}

function nameOnly(value, fallback = null) {
  if (!value) return fallback
  if (typeof value === 'object' && value.name) return { name: value.name }
  return fallback
}

function adminReference(value) {
  if (!value) return null
  if (typeof value === 'object' && value.name) return { id: value._id.toString(), name: value.name }
  return null
}

function sanitizeComplaint(complaint, includePrivate = false) {
  const response = {
    id: complaint._id.toString(),
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    reporter: includePrivate ? nameOnly(complaint.reporterId, complaint.reporterName ? { name: complaint.reporterName } : null) : null,
    assignedAdmin: adminReference(complaint.assignedAdminId),
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    escalatedAt: complaint.escalatedAt || null,
  }
  if (includePrivate) {
    response.description = complaint.description
    response.internalNotes = (complaint.internalNotes || []).map((entry) => ({
      note: entry.note,
      author: nameOnly(entry.authorId, { name: 'Administrator' }),
      createdAt: entry.createdAt,
    }))
    response.resolutionInfo = complaint.resolutionInfo || ''
    response.resolvedAt = complaint.resolvedAt || null
    response.rejectionReason = complaint.rejectionReason || ''
    response.rejectedAt = complaint.rejectedAt || null
    response.escalationReason = complaint.escalationReason || ''
  }
  return response
}

function populateComplaint(query) {
  return query
    .populate('reporterId', 'name')
    .populate('assignedAdminId', 'name')
    .populate('internalNotes.authorId', 'name')
}

async function getComplaints(query = {}) {
  requirePermission(query.actor, 'complaints.read')
  const { actor, ...filters } = query
  validateObjectInput(filters, QUERY_FIELDS, 'Complaint query')
  const { page, limit } = validatePagination(filters.page, filters.limit)
  const filter = {}

  if (filters.status !== undefined && filters.status !== '') {
    if (!STATUSES.has(filters.status)) throw createError('Invalid complaint status filter', 400)
    filter.status = filters.status
  }
  if (filters.priority !== undefined && filters.priority !== '') {
    if (!PRIORITIES.has(filters.priority)) throw createError('Invalid complaint priority filter', 400)
    filter.priority = filters.priority
  }
  if (filters.category !== undefined && filters.category !== '') {
    const category = normalizeText(filters.category, 'Category filter', 80)
    filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' }
  }
  if (filters.search !== undefined && filters.search !== '') {
    const search = normalizeText(filters.search, 'Search', 120)
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' }
      const searchCondition = { $or: [
        { title: pattern }, { description: pattern }, { category: pattern },
      ] }
      if (mongoose.isValidObjectId(search)) searchCondition.$or.push({ _id: search })
      filter.$and = [searchCondition]
    }
  }

  const countFilter = { ...filter }
  delete countFilter.status
  const [complaints, total, statusCounts] = await Promise.all([
    populateComplaint(Complaint.find(filter)).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Complaint.countDocuments(filter),
    Promise.all([...STATUSES].map(async (status) => [status, await Complaint.countDocuments({ ...countFilter, status })])),
  ])
  return {
    complaints: complaints.map((complaint) => sanitizeComplaint(complaint)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    counts: Object.fromEntries(statusCounts),
  }
}

async function getComplaintById(id, actor) {
  requirePermission(actor, 'complaints.read')
  if (!mongoose.isValidObjectId(id)) throw createError('Complaint not found', 404)
  const complaint = await populateComplaint(Complaint.findById(id)).lean()
  if (!complaint) throw createError('Complaint not found', 404)
  return sanitizeComplaint(complaint, true)
}

async function writeAudit(actor, complaint, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `complaint.${action}`,
    entityType: 'Complaint',
    entityId: complaint._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

async function findComplaint(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Complaint not found', 404)
  const complaint = await Complaint.findById(id)
  if (!complaint) throw createError('Complaint not found', 404)
  return complaint
}

function requireOpenComplaint(complaint) {
  if (['RESOLVED', 'REJECTED'].includes(complaint.status)) {
    throw createError('Closed complaints cannot be modified', 409)
  }
}

async function assignComplaint(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['adminId']), 'Complaint assignment')
  const adminId = input.adminId
  if (adminId !== null && (typeof adminId !== 'string' || !mongoose.isValidObjectId(adminId))) {
    throw createError('A valid administrator is required', 400)
  }
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  let assignedAdmin = null
  if (adminId) {
    assignedAdmin = await User.findOne({ _id: adminId, role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, accountStatus: 'ACTIVE' }).select('_id name')
    if (!assignedAdmin) throw createError('Active administrator not found', 404)
  }
  const previousAdminId = complaint.assignedAdminId?.toString() || null
  complaint.assignedAdminId = assignedAdmin?._id || null
  await complaint.save()
  await writeAudit(actor, complaint, assignedAdmin ? 'assigned' : 'unassigned', {
    previousAdminId,
    nextAdminId: assignedAdmin?._id.toString() || null,
  })
  return getComplaintById(complaint._id.toString(), actor)
}

async function addInternalNote(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['note']), 'Internal note')
  const note = normalizeText(input.note, 'Internal note', 2000, true, 1)
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  complaint.internalNotes.push({ authorId: actor.userId, note, createdAt: new Date() })
  await complaint.save()
  await writeAudit(actor, complaint, 'note_added', { noteLength: note.length })
  return getComplaintById(complaint._id.toString(), actor)
}

async function updateComplaintStatus(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['status']), 'Complaint status')
  if (!['OPEN', 'IN_REVIEW'].includes(input.status)) throw createError('Use resolve or reject actions to close a complaint', 400)
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  if (complaint.status === input.status) throw createError(`Complaint is already ${input.status}`, 409)
  const previousStatus = complaint.status
  complaint.status = input.status
  await complaint.save()
  await writeAudit(actor, complaint, 'status_updated', { previousStatus, nextStatus: input.status })
  return getComplaintById(complaint._id.toString(), actor)
}

async function resolveComplaint(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['resolutionInfo']), 'Complaint resolution')
  const resolutionInfo = normalizeText(input.resolutionInfo, 'Resolution information', 2000, true, 10)
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  const previousStatus = complaint.status
  complaint.status = 'RESOLVED'
  complaint.resolutionInfo = resolutionInfo
  complaint.resolvedBy = actor.userId
  complaint.resolvedAt = new Date()
  await complaint.save()
  await writeAudit(actor, complaint, 'resolved', { previousStatus, resolutionInfo })
  return getComplaintById(complaint._id.toString(), actor)
}

async function rejectComplaint(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['reason']), 'Complaint rejection')
  const reason = normalizeText(input.reason, 'Rejection reason', 1000, true, 10)
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  const previousStatus = complaint.status
  complaint.status = 'REJECTED'
  complaint.rejectionReason = reason
  complaint.rejectedBy = actor.userId
  complaint.rejectedAt = new Date()
  await complaint.save()
  await writeAudit(actor, complaint, 'rejected', { previousStatus, reason })
  return getComplaintById(complaint._id.toString(), actor)
}

async function escalateComplaint(id, input, actor) {
  requirePermission(actor, 'complaints.manage')
  validateObjectInput(input, new Set(['reason']), 'Complaint escalation')
  const reason = normalizeText(input.reason, 'Escalation reason', 1000, true, 10)
  const complaint = await findComplaint(id)
  requireOpenComplaint(complaint)
  const previousPriority = complaint.priority
  complaint.priority = 'URGENT'
  complaint.escalationReason = reason
  complaint.escalatedBy = actor.userId
  complaint.escalatedAt = new Date()
  await complaint.save()
  await writeAudit(actor, complaint, 'escalated', { previousPriority, nextPriority: 'URGENT', reason })
  return getComplaintById(complaint._id.toString(), actor)
}

module.exports = {
  getComplaints,
  getComplaintById,
  assignComplaint,
  addInternalNote,
  updateComplaintStatus,
  resolveComplaint,
  rejectComplaint,
  escalateComplaint,
}
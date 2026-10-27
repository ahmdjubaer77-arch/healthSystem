const mongoose = require('mongoose')
const HealthProfile = require('../models/HealthProfile')
const HealthTimeline = require('../models/MedicalTimeline')
const HealthDocument = require('../models/MedicalDocument')
const HealthShare = require('../models/HealthShare')
const HealthAccessEvent = require('../models/HealthAccessEvent')
const User = require('../models/User')
const healthService = require('./health.service')
const { PUBLIC_USER_ID_PATTERN } = require('../utils/public-user-id')

const timelineCategories = new Set([
  'MEDICAL_RECORD',
  'PRESCRIPTION',
  'REPORT',
  'DOCTOR_VISIT',
  'HOSPITAL_VISIT',
  'VACCINATION',
  'HEALTH_PROBLEM',
  'CURRENT_MEDICINE',
  'DOCTOR_CONSULTATION',
  'CHECKUP_REPORT',
  'UNCLASSIFIED',
])
const documentCategories = new Set(['PRESCRIPTION', 'MEDICAL_REPORT'])
const recordTypes = new Set(['PROFILE', 'TIMELINE', 'DOCUMENT', 'SHARE'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function idString(value) {
  return value?._id ? value._id.toString() : value?.toString()
}

function validateId(value, field) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw createError(`${field} is invalid`, 400)
  }
  return value
}

function validateScopeInput(scopes) {
  if (!Array.isArray(scopes) || scopes.length < 1 || scopes.length > 40) {
    throw createError('Choose at least one health information scope', 400)
  }

  const normalized = []
  const unique = new Set()
  for (const scope of scopes) {
    if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
      throw createError('A sharing scope is invalid', 400)
    }

    const { resourceType, category, resourceIds = [] } = scope
    const allowedKeys = new Set(['resourceType', 'category', 'resourceIds'])
    if (Object.keys(scope).some((key) => !allowedKeys.has(key))) {
      throw createError('A sharing scope contains unsupported fields', 400)
    }
    if (!Array.isArray(resourceIds) || resourceIds.length > 100) {
      throw createError('A scope may contain no more than 100 selected records', 400)
    }

    const normalizedType = typeof resourceType === 'string' ? resourceType : ''
    const normalizedCategory = typeof category === 'string' ? category : ''
    if (normalizedType === 'PROFILE') {
      if (normalizedCategory !== 'PROFILE' || resourceIds.length) {
        throw createError('The health profile scope is invalid', 400)
      }
    } else if (normalizedType === 'TIMELINE') {
      if (!timelineCategories.has(normalizedCategory)) {
        throw createError('A timeline category is invalid', 400)
      }
    } else if (normalizedType === 'DOCUMENT') {
      if (!documentCategories.has(normalizedCategory)) {
        throw createError('A document category is invalid', 400)
      }
    } else {
      throw createError('A sharing scope type is invalid', 400)
    }

    const ids = resourceIds.map((id) => validateId(id, 'Record ID'))
    const key = `${normalizedType}:${normalizedCategory}:${ids.slice().sort().join(',')}`
    if (unique.has(key)) throw createError('Duplicate sharing scopes are not allowed', 400)
    unique.add(key)
    normalized.push({ resourceType: normalizedType, category: normalizedCategory, resourceIds: ids })
  }

  return normalized
}

async function validateOwnedScopeRecords(ownerUserId, scopes) {
  for (const scope of scopes) {
    if (!scope.resourceIds.length) continue
    const Model = scope.resourceType === 'TIMELINE' ? HealthTimeline : HealthDocument
    const records = await Model.find({
      _id: { $in: scope.resourceIds },
      user: ownerUserId,
    }).select(scope.resourceType === 'TIMELINE' ? '_id recordType' : '_id type')

    if (records.length !== scope.resourceIds.length) {
      throw createError('One or more selected records are unavailable', 400)
    }
    const categoryField = scope.resourceType === 'TIMELINE' ? 'recordType' : 'type'
    if (records.some((record) => (record[categoryField] || 'UNCLASSIFIED') !== scope.category)) {
      throw createError('A selected record does not match its sharing category', 400)
    }
  }
}

function normalizePublicUserId(value) {
  if (typeof value !== 'string') throw createError('Custom User ID is invalid', 400)
  const publicUserId = value.trim().toUpperCase()
  if (!PUBLIC_USER_ID_PATTERN.test(publicUserId)) {
    throw createError('Enter a valid Custom User ID, for example BDH-7K9P2X4M', 400)
  }
  return publicUserId
}

function maskPublicUserId(publicUserId) {
  if (typeof publicUserId !== 'string' || !PUBLIC_USER_ID_PATTERN.test(publicUserId)) return null
  return `BDH-****${publicUserId.slice(-4)}`
}

async function findActiveRecipient(publicUserId) {
  const normalizedId = normalizePublicUserId(publicUserId)
  const recipient = await User.findOne({
    publicUserId: normalizedId,
    accountStatus: { $in: ['ACTIVE', null] },
  }).select('_id publicUserId name')
  return recipient
}

async function lookupRecipient(ownerUserId, publicUserId) {
  const recipient = await findActiveRecipient(publicUserId)
  if (!recipient || idString(recipient._id) === idString(ownerUserId)) {
    throw createError('No active account matches that Custom User ID', 404)
  }
  return {
    name: recipient.name,
    maskedUserId: maskPublicUserId(recipient.publicUserId),
  }
}

function parseExpiry(value) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw createError('Expiry date is invalid', 400)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateStart = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(dateStart.getTime()) || dateStart.toISOString().slice(0, 10) !== value) {
      throw createError('Expiry date is invalid', 400)
    }
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw createError('Expiry date must be in the future', 400)
  }
  return date
}

async function appendEvent(event) {
  await HealthAccessEvent.create(event)
}

async function createShare(ownerUserId, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('Sharing consent details are required', 400)
  }
  const allowedFields = new Set(['recipientPublicUserId', 'scopes', 'expiresAt', 'consentConfirmed'])
  if (Object.keys(input).some((key) => !allowedFields.has(key))) {
    throw createError('Sharing request contains unsupported fields', 400)
  }
  if (input.consentConfirmed !== true) throw createError('Explicit consent is required before sharing', 400)
  const recipient = await findActiveRecipient(input.recipientPublicUserId)
  if (!recipient) throw createError('No active account matches that Custom User ID', 404)
  const recipientUserId = idString(recipient._id)
  if (recipientUserId === idString(ownerUserId)) throw createError('You cannot share records with yourself', 400)
  const scopes = validateScopeInput(input.scopes)
  await validateOwnedScopeRecords(ownerUserId, scopes)

  const share = await HealthShare.create({
    ownerUserId,
    recipientUserId,
    scopes,
    expiresAt: parseExpiry(input.expiresAt),
    consentedAt: new Date(),
    status: 'ACTIVE',
    readOnly: true,
  })
  try {
    await appendEvent({
      shareId: share._id,
      ownerUserId,
      actorUserId: ownerUserId,
      action: 'SHARE_GRANTED',
      resourceType: 'SHARE',
      resourceId: share._id,
      result: 'SUCCESS',
    })
  } catch (error) {
    await HealthShare.deleteOne({ _id: share._id })
    throw error
  }
  return share
}

function shareStatus(share, now = new Date()) {
  if (share.status === 'REVOKED') return 'REVOKED'
  if (share.expiresAt && new Date(share.expiresAt) <= now) return 'EXPIRED'
  return 'ACTIVE'
}

async function listShares(ownerUserId) {
  const shares = await HealthShare.find({ ownerUserId }).sort({ createdAt: -1 }).lean()
  const recipientIds = [...new Set(shares.map((share) => idString(share.recipientUserId)))]
  const [users, lastViews] = await Promise.all([
    User.find({ _id: { $in: recipientIds } }).select('name role publicUserId').lean(),
    HealthAccessEvent.find({
      ownerUserId,
      shareId: { $in: shares.map((share) => share._id) },
      action: { $in: ['VIEW', 'DOWNLOAD'] },
      result: 'SUCCESS',
    }).sort({ timestamp: -1 }).select('shareId timestamp').lean(),
  ])
  const userById = new Map(users.map((user) => [idString(user._id), user]))
  const lastSeenByShare = new Map()
  for (const event of lastViews) {
    const key = idString(event.shareId)
    if (!lastSeenByShare.has(key)) lastSeenByShare.set(key, event.timestamp)
  }

  return shares.map((share) => {
    const recipientId = idString(share.recipientUserId)
    const recipient = userById.get(recipientId)
    return {
      id: idString(share._id),
      recipient: {
        name: recipient?.name || 'Unavailable account',
        maskedUserId: maskPublicUserId(recipient?.publicUserId),
      },
      scopes: share.scopes.map((scope) => ({
        resourceType: scope.resourceType,
        category: scope.category,
        resourceIds: scope.resourceIds.map(idString),
      })),
      readOnly: share.readOnly,
      status: shareStatus(share),
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      revokedAt: share.revokedAt,
      lastSeen: lastSeenByShare.get(idString(share._id)) || null,
    }
  })
}

async function listReceivedShares(recipientUserId) {
  const now = new Date()
  const shares = await HealthShare.find({
    recipientUserId,
    status: 'ACTIVE',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).sort({ createdAt: -1 }).limit(100).lean()

  if (!shares.length) return []

  const ownerIds = [...new Set(shares.map((share) => idString(share.ownerUserId)))]
  const owners = await User.find({ _id: { $in: ownerIds }, accountStatus: { $in: ['ACTIVE', null] } })
    .select('name publicUserId')
    .lean()
  const ownerById = new Map(owners.map((owner) => [idString(owner._id), owner]))

  return shares
    .filter((share) => ownerById.has(idString(share.ownerUserId)))
    .map((share) => {
      const owner = ownerById.get(idString(share.ownerUserId))
      return {
        id: idString(share._id),
        owner: {
          name: owner.name,
          maskedUserId: maskPublicUserId(owner.publicUserId),
        },
        scopes: share.scopes.map((scope) => ({
          resourceType: scope.resourceType,
          category: scope.category,
          recordCount: scope.resourceIds.length,
        })),
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
      }
    })
}

async function revokeShare(ownerUserId, shareId) {
  validateId(shareId, 'Share ID')
  const share = await HealthShare.findOneAndUpdate(
    { _id: shareId, ownerUserId, status: 'ACTIVE' },
    { $set: { status: 'REVOKED', revokedAt: new Date() } },
    { new: true },
  )
  if (!share) throw createError('Active share not found', 404)
  await appendEvent({
    shareId: share._id,
    ownerUserId,
    actorUserId: ownerUserId,
    action: 'SHARE_REVOKED',
    resourceType: 'SHARE',
    resourceId: share._id,
    result: 'SUCCESS',
  })
  return { id: idString(share._id), status: 'REVOKED', revokedAt: share.revokedAt }
}

async function getShareForRecipient(actorUserId, shareId, resourceType, resourceId = null) {
  if (!mongoose.isValidObjectId(shareId)) throw createError('Shared record not found', 404)
  const share = await HealthShare.findOne({ _id: shareId, recipientUserId: actorUserId })
  if (!share) {
    const inaccessibleShare = await HealthShare.findById(shareId)
    if (inaccessibleShare) {
      await appendEvent({
        shareId: inaccessibleShare._id,
        ownerUserId: inaccessibleShare.ownerUserId,
        actorUserId,
        action: 'ACCESS_DENIED',
        resourceType,
        resourceId: mongoose.isValidObjectId(resourceId) ? resourceId : null,
        result: 'DENIED',
      })
    }
    throw createError('Shared record not found', 404)
  }

  const deny = async () => {
    await appendEvent({
      shareId: share._id,
      ownerUserId: share.ownerUserId,
      actorUserId,
      action: 'ACCESS_DENIED',
      resourceType,
      resourceId: mongoose.isValidObjectId(resourceId) ? resourceId : null,
      result: 'DENIED',
    })
    throw createError('Shared record not found or access is unavailable', 404)
  }

  if (share.status !== 'ACTIVE' || (share.expiresAt && share.expiresAt <= new Date())) return deny()
  const activeRecipient = await User.findOne({ _id: actorUserId, accountStatus: 'ACTIVE' }).select('_id')
  if (!activeRecipient) return deny()
  return { share, deny }
}

function authorizedScopes(share, resourceType) {
  return share.scopes.filter((scope) => scope.resourceType === resourceType)
}

function scopeRecordFilter(scopes) {
  const filters = []
  for (const scope of scopes) {
    const categoryField = scope.resourceType === 'TIMELINE' ? 'recordType' : 'type'
    const categoryFilter = scope.resourceType === 'TIMELINE' && scope.category === 'UNCLASSIFIED'
      ? { $or: [{ recordType: null }, { recordType: { $exists: false } }] }
      : { [categoryField]: scope.category }
    if (scope.resourceIds.length) {
      filters.push({ $and: [{ _id: { $in: scope.resourceIds } }, categoryFilter] })
    } else {
      filters.push(categoryFilter)
    }
  }
  return filters
}

function validatePageQuery(query = {}) {
  const page = Number(query.page ?? 1)
  const limit = Number(query.limit ?? 20)
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createError('Pagination values are invalid', 400)
  }
  return { page, limit }
}

async function listSharedTimeline(actorUserId, shareId, query = {}) {
  const { page, limit } = validatePageQuery(query)
  const { share, deny } = await getShareForRecipient(actorUserId, shareId, 'TIMELINE')
  const scopes = authorizedScopes(share, 'TIMELINE')
  if (!scopes.length) return deny()
  const filter = {
    user: share.ownerUserId,
    $or: scopeRecordFilter(scopes),
  }
  const [records, total] = await Promise.all([
    HealthTimeline.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    HealthTimeline.countDocuments(filter),
  ])
  if (records.length) {
    await Promise.all(records.map((record) => appendEvent({
      shareId: share._id,
      ownerUserId: share.ownerUserId,
      actorUserId,
      action: 'VIEW',
      resourceType: 'TIMELINE',
      resourceId: record._id,
      result: 'SUCCESS',
    })))
  }
  return {
    records: records.map((record) => ({
      id: idString(record._id),
      type: record.type,
      recordType: record.recordType || null,
      source: record.source,
      title: record.title,
      description: record.description,
      details: record.details,
      date: record.date,
      createdAt: record.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function listSharedDocuments(actorUserId, shareId, query = {}) {
  const { page, limit } = validatePageQuery(query)
  const { share, deny } = await getShareForRecipient(actorUserId, shareId, 'DOCUMENT')
  const scopes = authorizedScopes(share, 'DOCUMENT')
  if (!scopes.length) return deny()
  const filter = { user: share.ownerUserId, $or: scopeRecordFilter(scopes) }
  const [documents, total] = await Promise.all([
    HealthDocument.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    HealthDocument.countDocuments(filter),
  ])
  if (documents.length) {
    await Promise.all(documents.map((document) => appendEvent({
      shareId: share._id,
      ownerUserId: share.ownerUserId,
      actorUserId,
      action: 'VIEW',
      resourceType: 'DOCUMENT',
      resourceId: document._id,
      result: 'SUCCESS',
    })))
  }
  return {
    documents: documents.map((document) => ({
      id: idString(document._id),
      type: document.type,
      title: document.title,
      description: document.description,
      format: document.format,
      originalFileName: document.originalFileName,
      fileSize: document.fileSize,
      createdAt: document.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function getSharedProfile(actorUserId, shareId) {
  const { share, deny } = await getShareForRecipient(actorUserId, shareId, 'PROFILE')
  if (!authorizedScopes(share, 'PROFILE').some((scope) => scope.category === 'PROFILE')) return deny()
  const profile = await HealthProfile.findOne({ user: share.ownerUserId }).lean()
  if (!profile) throw createError('Shared record not found or access is unavailable', 404)
  await appendEvent({
    shareId: share._id,
    ownerUserId: share.ownerUserId,
    actorUserId,
    action: 'VIEW',
    resourceType: 'PROFILE',
    resourceId: profile._id,
    result: 'SUCCESS',
  })
  const { _id, user, __v, ...data } = profile
  return data
}

async function getSharedDocumentContent(actorUserId, shareId, documentId) {
  const validDocumentId = validateId(documentId, 'Document ID')
  const { share, deny } = await getShareForRecipient(actorUserId, shareId, 'DOCUMENT', validDocumentId)
  const scopes = authorizedScopes(share, 'DOCUMENT')
  const document = await HealthDocument.findOne({ _id: validDocumentId, user: share.ownerUserId }).select('type')
  const allowed = document && scopes.some((scope) => (
    scope.category === document.type
    && (!scope.resourceIds.length || scope.resourceIds.some((id) => idString(id) === validDocumentId))
  ))
  if (!allowed) return deny()

  const file = await healthService.getMedicalDocumentContent(idString(share.ownerUserId), validDocumentId)
  if (share.status !== 'ACTIVE' || (share.expiresAt && share.expiresAt <= new Date())) return deny()
  await appendEvent({
    shareId: share._id,
    ownerUserId: share.ownerUserId,
    actorUserId,
    action: 'DOWNLOAD',
    resourceType: 'DOCUMENT',
    resourceId: validDocumentId,
    result: 'SUCCESS',
  })
  return file
}

async function listAccessHistory(ownerUserId, query = {}) {
  const { page, limit } = validatePageQuery(query)
  const allowedActions = new Set(['VIEW', 'DOWNLOAD', 'ACCESS_DENIED', 'SHARE_GRANTED', 'SHARE_REVOKED'])
  const allowedResults = new Set(['SUCCESS', 'DENIED'])
  const filter = { ownerUserId }
  if (query.action) {
    if (!allowedActions.has(query.action)) throw createError('Action filter is invalid', 400)
    filter.action = query.action
  }
  if (query.result) {
    if (!allowedResults.has(query.result)) throw createError('Result filter is invalid', 400)
    filter.result = query.result
  }
  if (query.shareId) {
    filter.shareId = validateId(query.shareId, 'Share ID')
  }

  const [events, total] = await Promise.all([
    HealthAccessEvent.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    HealthAccessEvent.countDocuments(filter),
  ])
  const actorIds = [...new Set(events.map((event) => idString(event.actorUserId)))]
  const users = await User.find({ _id: { $in: actorIds } }).select('name role').lean()
  const userById = new Map(users.map((user) => [idString(user._id), user]))

  return {
    records: events.map((event) => {
      const actor = userById.get(idString(event.actorUserId))
      return {
        id: idString(event._id),
        shareId: idString(event.shareId),
        actor: { name: actor?.name || 'Account unavailable', role: actor?.role || '' },
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ? idString(event.resourceId) : null,
        result: event.result,
        timestamp: event.timestamp,
      }
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function revokeSharesForAccountDeletion(userId) {
  const shares = await HealthShare.find({
    $or: [{ ownerUserId: userId }, { recipientUserId: userId }],
    status: 'ACTIVE',
  })
  if (!shares.length) return

  const revokedAt = new Date()
  await HealthShare.updateMany(
    { _id: { $in: shares.map((share) => share._id) }, status: 'ACTIVE' },
    { $set: { status: 'REVOKED', revokedAt } },
  )
  await HealthAccessEvent.insertMany(shares.map((share) => ({
    shareId: share._id,
    ownerUserId: share.ownerUserId,
    actorUserId: userId,
    action: 'SHARE_REVOKED',
    resourceType: 'SHARE',
    resourceId: share._id,
    result: 'SUCCESS',
    timestamp: revokedAt,
  })))
}

module.exports = {
  createShare,
  getSharedDocumentContent,
  getSharedProfile,
  listAccessHistory,
  listReceivedShares,
  lookupRecipient,
  listSharedDocuments,
  listSharedTimeline,
  listShares,
  revokeShare,
  revokeSharesForAccountDeletion,
  validateScopeInput,
}

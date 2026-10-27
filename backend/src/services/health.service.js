const mongoose = require('mongoose')
const path = require('path')
const { Readable } = require('stream')
const HealthProfile = require('../models/HealthProfile')
const MedicalTimeline = require('../models/MedicalTimeline')
const MedicalDocument = require('../models/MedicalDocument')
const { cloudinary, ensureCloudinaryConfigured } = require('../config/cloudinary')

const timelineTypes = new Set([
  'DIAGNOSIS',
  'VISIT',
  'HOSPITALIZATION',
  'SURGERY',
  'VACCINATION',
  'MEDICATION',
  'OTHER',
])

const bloodGroups = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

const healthProfileFields = new Set([
  'bloodGroup',
  'emergencyContact',
  'allergies',
  'existingConditions',
  'currentMedications',
  'familyMedicalHistory',
  'emergencyMedicalInfo',
])

const ownershipFields = new Set(['user', 'userId', '_id', 'createdAt', 'updatedAt', '__v'])
const timelineFields = new Set(['type', 'recordType', 'title', 'description', 'details', 'date'])
const recordTypes = new Set([
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
])
const medicalDocumentTypes = new Set(['PRESCRIPTION', 'MEDICAL_REPORT'])
const timelineDetailFields = {
  MEDICAL_RECORD: new Set(),
  PRESCRIPTION: new Set(['medicine', 'doctor', 'notes']),
  REPORT: new Set(['name', 'notes']),
  DOCTOR_VISIT: new Set(['doctor', 'specialty', 'reason', 'notes', 'followUpDate']),
  HOSPITAL_VISIT: new Set(['hospital', 'reason', 'notes']),
  VACCINATION: new Set(['name', 'dose', 'provider', 'nextDose']),
  HEALTH_PROBLEM: new Set(['symptoms']),
  CURRENT_MEDICINE: new Set(['strength', 'instructions', 'startDate', 'endDate', 'status', 'doctorName']),
  DOCTOR_CONSULTATION: new Set(['doctorName', 'clinic', 'problem', 'counsellingNotes', 'followUpDate']),
  CHECKUP_REPORT: new Set(['result', 'units', 'referenceRange', 'laboratory', 'fileReference']),
}

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function assertObject(input, message) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError(message, 400)
  }
}

function validateString(value, field, maxLength, { allowEmpty = true } = {}) {
  if (typeof value !== 'string') {
    throw createError(`${field} must be a string`, 400)
  }

  const trimmed = value.trim()
  if ((!allowEmpty && !trimmed) || trimmed.length > maxLength) {
    throw createError(`${field} must be ${allowEmpty ? 'no more than' : 'between 1 and'} ${maxLength} characters`, 400)
  }

  return trimmed
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.length > 50) {
    throw createError(`${field} must be an array with no more than 50 items`, 400)
  }

  return value.map((item) => validateString(item, `${field} item`, 160, { allowEmpty: false }))
}

function validateEmergencyContact(value) {
  if (value === null) return null

  assertObject(value, 'Emergency contact must be an object')
  const allowedFields = new Set(['name', 'relationship', 'phone'])
  const contact = {}

  for (const [field, fieldValue] of Object.entries(value)) {
    if (!allowedFields.has(field)) {
      throw createError(`Emergency contact field is not allowed: ${field}`, 400)
    }

    const maxLength = field === 'phone' ? 20 : field === 'name' ? 100 : 60
    contact[field] = validateString(fieldValue, `Emergency contact ${field}`, maxLength)
  }

  return contact
}

function validateHealthProfileInput(input, { partial = false } = {}) {
  assertObject(input, 'A health profile object is required')
  const updates = {}

  for (const [field, value] of Object.entries(input)) {
    if (ownershipFields.has(field)) continue
    if (!healthProfileFields.has(field)) {
      throw createError(`Health profile field is not allowed: ${field}`, 400)
    }

    if (field === 'emergencyContact') {
      updates[field] = validateEmergencyContact(value)
    } else if (field === 'emergencyMedicalInfo') {
      updates[field] = value === null ? '' : validateString(value, field, 2000)
    } else if (field === 'bloodGroup') {
      const validatedBloodGroup = validateString(value, field, 20)
      if (validatedBloodGroup && !bloodGroups.has(validatedBloodGroup)) {
        throw createError('Blood group is invalid', 400)
      }
      updates[field] = validatedBloodGroup
    } else {
      updates[field] = validateStringArray(value, field)
    }
  }

  if (partial && Object.keys(updates).length === 0) {
    throw createError('At least one health profile field is required', 400)
  }

  return updates
}

function validateTimelineDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    throw createError('Date must use YYYY-MM-DD or ISO date-time format', 400)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw createError('Date must be valid', 400)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && date.toISOString().slice(0, 10) !== value) {
    throw createError('Date must be valid', 400)
  }

  return date
}

function validateTimelineInput(input) {
  assertObject(input, 'A timeline entry object is required')
  const updates = {}

  for (const [field, value] of Object.entries(input)) {
    if (ownershipFields.has(field) || field === 'source') {
      throw createError('Record ownership and authorship are assigned by the server', 400)
    }
    if (!timelineFields.has(field)) {
      throw createError(`Timeline field is not allowed: ${field}`, 400)
    }

    if (field === 'type') {
      if (typeof value !== 'string' || !timelineTypes.has(value)) {
        throw createError('Timeline type is invalid', 400)
      }
      updates.type = value
    } else if (field === 'recordType') {
      if (typeof value !== 'string' || !recordTypes.has(value)) {
        throw createError('Record type is invalid', 400)
      }
      updates.recordType = value
    } else if (field === 'title') {
      updates.title = validateString(value, 'Title', 160, { allowEmpty: false })
    } else if (field === 'description') {
      updates.description = value === null ? '' : validateString(value, 'Description', 2000)
    } else if (field === 'details') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw createError('Record details must be an object', 400)
      }
      updates.details = validateTimelineDetails(value, input.recordType)
    } else {
      updates.date = validateTimelineDate(value)
    }
  }

  for (const field of ['type', 'title', 'date']) {
    if (updates[field] === undefined) {
      throw createError(`${field} is required`, 400)
    }
  }
  if (updates.recordType === 'HEALTH_PROBLEM' && !updates.description?.trim()) {
    throw createError('Description is required', 400)
  }

  return updates
}

function validateTimelineDetails(input, recordType) {
  const allowedFields = timelineDetailFields[recordType] || new Set()
  const details = {}

  for (const [field, value] of Object.entries(input)) {
    if (!allowedFields.has(field)) {
      throw createError(`Record detail field is not allowed: ${field}`, 400)
    }

    if (field === 'nextDose' || field === 'startDate' || field === 'endDate' || field === 'followUpDate') {
      details[field] = value === '' || value === null ? '' : validateTimelineDate(value).toISOString().slice(0, 10)
      continue
    }

    if (field === 'status') {
      if (!['ACTIVE', 'PAUSED', 'COMPLETED'].includes(value)) {
        throw createError('Medicine status is invalid', 400)
      }
      details[field] = value
      continue
    }

    if (field === 'fileReference') {
      if (value === '' || value === null) {
        details[field] = ''
      } else if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
        throw createError('Report file reference is invalid', 400)
      } else {
        details[field] = value
      }
      continue
    }

    const maxLength = ['instructions', 'counsellingNotes', 'result'].includes(field) ? 2000 : 500
    details[field] = value === null ? '' : validateString(value, field, maxLength)
  }

  const requiredByType = {
    HEALTH_PROBLEM: ['symptoms'],
    CURRENT_MEDICINE: ['strength', 'instructions', 'startDate', 'status'],
    DOCTOR_VISIT: ['doctor', 'specialty', 'reason'],
    HOSPITAL_VISIT: ['hospital', 'reason'],
    VACCINATION: ['name'],
    DOCTOR_CONSULTATION: ['doctorName', 'clinic', 'problem'],
    CHECKUP_REPORT: ['result'],
  }
  for (const field of requiredByType[recordType] || []) {
    if (!details[field]) {
      throw createError(`${field} is required`, 400)
    }
  }

  if (details.startDate && details.endDate && details.endDate < details.startDate) {
    throw createError('Medicine end date must be on or after the start date', 400)
  }

  return details
}

function healthProfileResponse(profile) {
  return {
    id: profile._id.toString(),
    bloodGroup: profile.bloodGroup || '',
    emergencyContact: profile.emergencyContact || null,
    allergies: profile.allergies,
    existingConditions: profile.existingConditions,
    currentMedications: profile.currentMedications,
    familyMedicalHistory: profile.familyMedicalHistory,
    emergencyMedicalInfo: profile.emergencyMedicalInfo,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

function timelineEntryResponse(entry) {
  return {
    id: entry._id.toString(),
    type: entry.type,
    recordType: entry.recordType,
    source: entry.source || 'PATIENT_ENTERED',
    title: entry.title,
    description: entry.description,
    details: entry.details || {},
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
}

async function getHealthProfile(userId) {
  const profile = await HealthProfile.findOne({ user: userId })
  if (!profile) {
    throw createError('Health profile not found', 404)
  }

  return healthProfileResponse(profile)
}

async function createHealthProfile(userId, input) {
  const fields = validateHealthProfileInput(input)

  try {
    const profile = await HealthProfile.create({ ...fields, user: userId })
    return healthProfileResponse(profile)
  } catch (error) {
    if (error.code === 11000) {
      throw createError('Health profile already exists', 409)
    }
    throw error
  }
}

async function updateHealthProfile(userId, input) {
  const fields = validateHealthProfileInput(input, { partial: true })
  const profile = await HealthProfile.findOneAndUpdate(
    { user: userId },
    { $set: fields },
    { new: true, runValidators: true },
  )

  if (!profile) {
    throw createError('Health profile not found', 404)
  }

  return healthProfileResponse(profile)
}

function validateTimelineQuery(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 50 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1 || page > 100000) {
    throw createError('Page must be a positive integer', 400)
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createError('Limit must be an integer between 1 and 100', 400)
  }

  const dateQuery = {}
  if (query.from !== undefined) dateQuery.$gte = validateTimelineDate(query.from)
  if (query.to !== undefined) {
    dateQuery.$lte = validateTimelineDate(query.to)
    if (/^\d{4}-\d{2}-\d{2}$/.test(query.to)) dateQuery.$lte.setUTCHours(23, 59, 59, 999)
  }
  if (dateQuery.$gte && dateQuery.$lte && dateQuery.$gte > dateQuery.$lte) {
    throw createError('The from date must be on or before the to date', 400)
  }
  return { page, limit, dateQuery }
}

async function getTimeline(userId, query) {
  const { page, limit, dateQuery } = validateTimelineQuery(query)
  const filter = { user: userId }
  if (Object.keys(dateQuery).length) filter.date = dateQuery

  const [entries, total] = await Promise.all([
    MedicalTimeline.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    MedicalTimeline.countDocuments(filter),
  ])

  return {
    timeline: entries.map(timelineEntryResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function createTimelineEntry(userId, input) {
  const fields = validateTimelineInput(input)
  if (fields.details?.fileReference) {
    const file = await MedicalDocument.findOne({ _id: fields.details.fileReference, user: userId }).select('_id')
    if (!file) throw createError('Report file reference not found', 404)
  }
  const entry = await MedicalTimeline.create({ ...fields, user: userId, source: 'PATIENT_ENTERED' })
  return timelineEntryResponse(entry)
}

async function updateTimelineEntry(userId, entryId, input) {
  if (!mongoose.isValidObjectId(entryId)) {
    throw createError('Timeline entry not found', 404)
  }
  assertObject(input, 'A timeline entry object is required')

  const filter = { _id: entryId, user: userId }
  const entry = await MedicalTimeline.findOne(filter)
  if (!entry) {
    throw createError('Timeline entry not found', 404)
  }
  if (input.details !== undefined) {
    assertObject(input.details, 'Record details must be an object')
  }

  const recordType = input?.recordType ?? entry.recordType
  const mergedInput = {
    type: input?.type ?? entry.type,
    title: input?.title ?? entry.title,
    description: input.description !== undefined ? input.description : entry.description ?? '',
    date: input?.date ?? new Date(entry.date).toISOString(),
  }
  if (recordType) mergedInput.recordType = recordType
  if (recordType || input?.details !== undefined) {
    mergedInput.details = {
      ...(entry.details || {}),
      ...(input?.details || {}),
    }
  }

  const validationInput = { ...mergedInput, ...input }
  if (input.details !== undefined) validationInput.details = mergedInput.details
  const fields = validateTimelineInput(validationInput)
  if (fields.details?.fileReference) {
    const file = await MedicalDocument.findOne({ _id: fields.details.fileReference, user: userId }).select('_id')
    if (!file) throw createError('Report file reference not found', 404)
  }
  const updatedEntry = await MedicalTimeline.findOneAndUpdate(
    filter,
    { $set: fields },
    { new: true, runValidators: true },
  )

  if (!updatedEntry) {
    throw createError('Timeline entry not found', 404)
  }

  return timelineEntryResponse(updatedEntry)
}

async function deleteTimelineEntry(userId, entryId) {
  if (!mongoose.isValidObjectId(entryId)) {
    throw createError('Timeline entry not found', 404)
  }

  const entry = await MedicalTimeline.findOneAndDelete({ _id: entryId, user: userId })
  if (!entry) {
    throw createError('Timeline entry not found', 404)
  }

  return { id: entry._id.toString() }
}

function validateMedicalDocumentMetadata(input) {
  assertObject(input, 'Medical document details are required')
  const fields = new Set(['type', 'title', 'description'])
  const metadata = {}

  for (const [field, value] of Object.entries(input)) {
    if (field === 'user' || field === 'userId') {
      throw createError('Document ownership is assigned by the server', 400)
    }
    if (!fields.has(field)) {
      throw createError(`Medical document field is not allowed: ${field}`, 400)
    }

    if (field === 'type') {
      if (typeof value !== 'string' || !medicalDocumentTypes.has(value)) {
        throw createError('Medical document type is invalid', 400)
      }
      metadata.type = value
    } else if (field === 'title') {
      metadata.title = validateString(value, 'Title', 160, { allowEmpty: false })
    } else {
      metadata.description = validateString(value, 'Description', 2000)
    }
  }

  if (!metadata.type || !metadata.title) {
    throw createError('Document type and title are required', 400)
  }

  return metadata
}

function validateMedicalFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.size < 1) {
    throw createError('Unsupported or invalid file', 400)
  }

  const extension = path.extname(file.originalname.replace(/\\/g, '/')).toLowerCase()
  const signatures = {
    'application/pdf': { extensions: ['.pdf'], signature: Buffer.from('%PDF-'), resourceType: 'raw', format: 'pdf' },
    'image/jpeg': { extensions: ['.jpg', '.jpeg'], signature: Buffer.from([0xff, 0xd8, 0xff]), resourceType: 'image', format: 'jpg' },
    'image/png': { extensions: ['.png'], signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), resourceType: 'image', format: 'png' },
    'image/webp': { extensions: ['.webp'], signature: Buffer.from('RIFF'), resourceType: 'image', format: 'webp' },
  }
  const expected = signatures[file.mimetype]

  const validSignature = expected
    && file.buffer.subarray(0, expected.signature.length).equals(expected.signature)
    && (file.mimetype !== 'image/webp' || file.buffer.subarray(8, 12).toString() === 'WEBP')

  if (!expected || !expected.extensions.includes(extension) || !validSignature) {
    throw createError('Unsupported or invalid file', 400)
  }

  return expected
}

function documentResponse(document) {
  return {
    id: document._id.toString(),
    type: document.type,
    title: document.title,
    description: document.description,
    format: document.format,
    originalFileName: document.originalFileName,
    fileSize: document.fileSize,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
}

function uploadToCloudinary(file, userId, resourceType) {
  ensureCloudinaryConfigured()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      resource_type: resourceType,
      type: 'authenticated',
      access_mode: 'authenticated',
      folder: `medical-documents/${userId}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    }, (error, result) => {
      if (error || !result?.public_id || !result?.secure_url) {
        return reject(createError('Unable to store medical document', 502))
      }

      resolve(result)
    })

    Readable.from(file.buffer).pipe(uploadStream).on('error', () => {
      reject(createError('Unable to store medical document', 502))
    })
  })
}

async function deleteCloudinaryResource(document) {
  ensureCloudinaryConfigured()

  let result
  try {
    result = await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
      resource_type: document.resourceType,
      type: 'authenticated',
      invalidate: true,
    })
  } catch {
    throw createError('Unable to delete stored medical document', 502)
  }

  if (result?.result !== 'ok') {
    throw createError('Unable to delete stored medical document', 502)
  }
}

async function uploadMedicalDocument(userId, file, input) {
  const metadata = validateMedicalDocumentMetadata(input)
  const fileDetails = validateMedicalFile(file)
  const upload = await uploadToCloudinary(file, userId, fileDetails.resourceType)
  const originalFileName = path.basename(file.originalname.replace(/\\/g, '/')).slice(0, 255)

  try {
    const document = await MedicalDocument.create({
      ...metadata,
      user: userId,
      cloudinaryPublicId: upload.public_id,
      cloudinaryUrl: upload.secure_url,
      resourceType: upload.resource_type || fileDetails.resourceType,
      format: upload.format || fileDetails.format,
      originalFileName,
      fileSize: upload.bytes || file.size,
    })

    return documentResponse(document)
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(upload.public_id, {
        resource_type: upload.resource_type || fileDetails.resourceType,
        type: 'authenticated',
        invalidate: true,
      })
    } catch {
      // Preserve the database failure; callers receive only the centralized safe error.
    }

    throw error
  }
}

async function getMedicalDocuments(userId) {
  const documents = await MedicalDocument.find({ user: userId }).sort({ createdAt: -1 })
  return documents.map(documentResponse)
}

async function getMedicalDocumentContent(userId, documentId) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw createError('Medical document not found', 404)
  }

  const document = await MedicalDocument.findOne({ _id: documentId, user: userId })
  if (!document) {
    throw createError('Medical document not found', 404)
  }

  const contentTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  const contentType = contentTypes[document.format?.toLowerCase()]
  if (!contentType || !document.cloudinaryPublicId) {
    throw createError('Medical document file is unavailable', 404)
  }

  ensureCloudinaryConfigured()
  const expiresAt = Math.floor(Date.now() / 1000) + 120
  let downloadUrl
  try {
    downloadUrl = cloudinary.utils.private_download_url(
      document.cloudinaryPublicId,
      document.format,
      {
        resource_type: document.resourceType,
        type: 'authenticated',
        expires_at: expiresAt,
      },
    )
  } catch {
    throw createError('Unable to retrieve medical document', 502)
  }

  let response
  try {
    response = await fetch(downloadUrl, { signal: AbortSignal.timeout(15000) })
  } catch {
    throw createError('Unable to retrieve medical document', 502)
  }
  if (response.status === 404) {
    throw createError('Medical document file is unavailable', 404)
  }
  if (!response.ok) {
    throw createError('Unable to retrieve medical document', 502)
  }

  let buffer
  try {
    buffer = Buffer.from(await response.arrayBuffer())
  } catch {
    throw createError('Unable to retrieve medical document', 502)
  }
  if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
    throw createError('Medical document file is unavailable', 404)
  }

  return {
    buffer,
    contentType,
    fileName: path.basename(document.originalFileName || 'medical-report'),
  }
}

async function deleteMedicalDocument(userId, documentId) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw createError('Medical document not found', 404)
  }

  const document = await MedicalDocument.findOne({ _id: documentId, user: userId })
  if (!document) {
    throw createError('Medical document not found', 404)
  }

  await deleteCloudinaryResource(document)
  await document.deleteOne()
  return { id: document._id.toString() }
}

module.exports = {
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  getTimeline,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  uploadMedicalDocument,
  getMedicalDocuments,
  getMedicalDocumentContent,
  deleteMedicalDocument,
  validateMedicalFile,
  validateTimelineInput,
  validateTimelineQuery,
}
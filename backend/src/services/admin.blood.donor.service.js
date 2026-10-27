const mongoose = require('mongoose')
const crypto = require('node:crypto')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const { createUserWithPublicId } = require('../utils/public-user-id')
const AdminAuditLog = require('../models/AdminAuditLog')

const BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const AVAILABILITY_STATUSES = new Set(['AVAILABLE', 'UNAVAILABLE'])
const VERIFICATION_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'])
const CONTACT_METHODS = new Set(['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'])
const QUERY_FIELDS = new Set(['page', 'limit', 'search', 'bloodGroup', 'division', 'district', 'upazila', 'availability', 'verificationStatus'])

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

function normalizeFilter(value, field) {
  if (value === undefined || value === '') return ''
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (normalized.length > 100) throw createError(`${field} is too long`, 400)
  return normalized
}

function getDonorAvailability(user) {
  return user.donorAvailability || 'UNAVAILABLE'
}

function getDonorVerificationStatus(user) {
  return user.donorVerificationStatus || 'PENDING'
}

function buildDonorResponse(user, includeContact = false) {
  const response = {
    id: user._id.toString(),
    name: user.name,
    bloodGroup: user.bloodGroup || '',
    location: {
      division: user.location?.division || '',
      district: user.location?.district || '',
      upazila: user.location?.upazila || '',
    },
    availability: getDonorAvailability(user),
    verificationStatus: getDonorVerificationStatus(user),
    verificationReason: user.donorVerificationReason || '',
    verifiedAt: user.donorVerifiedAt || null,
    suspendedAt: user.donorSuspendedAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
  if (includeContact) {
    if (!user.donorStandalone) response.email = user.email
    response.phone = user.phone || ''
    response.phoneConsent = user.donorPhoneConsent === true
    response.lastDonationDate = user.donorLastDonationDate || null
    response.preferredContactMethod = user.donorPreferredContactMethod || ''
    response.notes = user.donorNotes || ''
  }
  return response
}

async function getDonors(query = {}) {
  validateObjectInput(query, QUERY_FIELDS, 'Donor query')
  const { page, limit } = validatePagination(query.page, query.limit)
  const filter = { role: 'BLOOD_DONOR' }
  const search = normalizeFilter(query.search, 'Search')
  const conditions = []

  if (query.bloodGroup !== undefined && query.bloodGroup !== '') {
    if (typeof query.bloodGroup !== 'string' || !BLOOD_GROUPS.has(query.bloodGroup)) {
      throw createError('Invalid blood group filter', 400)
    }
    filter.bloodGroup = query.bloodGroup
  }
  if (query.availability !== undefined && query.availability !== '') {
    if (typeof query.availability !== 'string' || !AVAILABILITY_STATUSES.has(query.availability)) {
      throw createError('Invalid availability filter', 400)
    }
    if (query.availability === 'AVAILABLE') filter.donorAvailability = 'AVAILABLE'
    else conditions.push({ $or: [
      { donorAvailability: 'UNAVAILABLE' },
      { donorAvailability: { $exists: false } },
    ] })
  }
  if (query.verificationStatus !== undefined && query.verificationStatus !== '') {
    if (typeof query.verificationStatus !== 'string' || !VERIFICATION_STATUSES.has(query.verificationStatus)) {
      throw createError('Invalid verification status filter', 400)
    }
    filter.donorVerificationStatus = query.verificationStatus
  }

  for (const field of ['division', 'district', 'upazila']) {
    const value = normalizeFilter(query[field], field)
    if (value) filter[`location.${field}`] = { $regex: escapeRegex(value), $options: 'i' }
  }
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    conditions.push({ $or: [
      { name: pattern }, { email: pattern }, { phone: pattern },
      { 'location.division': pattern }, { 'location.district': pattern }, { 'location.upazila': pattern },
    ] })
  }
  if (conditions.length) filter.$and = conditions

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ])
  return {
    donors: users.map((user) => buildDonorResponse(user)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

async function getPatientAccounts(query = {}, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(query, new Set(['search']), 'Patient search')
  const search = normalizeFilter(query.search, 'Search')
  if (search.length < 2) throw createError('Enter at least 2 characters to search patient accounts', 400)
  const pattern = { $regex: escapeRegex(search), $options: 'i' }
  const patients = await User.find({
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    $or: [{ name: pattern }, { phone: pattern }],
  }).select('_id name phone bloodGroup').sort({ name: 1 }).limit(20).lean()
  return {
    patients: patients.map((patient) => ({
      id: patient._id.toString(),
      name: patient.name,
      phone: patient.phone || '',
      bloodGroup: patient.bloodGroup || '',
    })),
  }
}

async function getDonorById(id) {
  if (!mongoose.isValidObjectId(id)) throw createError('Donor not found', 404)
  const donor = await User.findOne({ _id: id, role: 'BLOOD_DONOR' }).select('-passwordHash').lean()
  if (!donor) throw createError('Donor not found', 404)
  return buildDonorResponse(donor, true)
}

async function writeAudit(actor, donor, action, details = {}) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action,
    entityType: 'User',
    entityId: donor._id,
    result: 'SUCCESS',
    details,
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

function validateDonorInput(input, creating = false) {
  const allowedFields = new Set(['name', 'email', 'phone', 'bloodGroup', 'location', 'availability', 'lastDonationDate', 'preferredContactMethod', 'phoneConsent', 'notes'])
  if (creating) {
    allowedFields.add('accountMode')
    allowedFields.add('patientAccountId')
  }
  validateObjectInput(input, allowedFields, 'Donor')
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (input.email !== undefined && typeof input.email !== 'string') throw createError('Email must be a string', 400)
  const email = input.email ? input.email.trim().toLowerCase() : ''
  if (creating && email) throw createError('Select the patient account directly; email is not accepted for donor creation', 400)
  if (creating && !['EXISTING_PATIENT', 'STANDALONE'].includes(input.accountMode)) {
    throw createError('Select an existing patient account or choose standalone donor creation', 400)
  }
  if (creating && input.accountMode === 'EXISTING_PATIENT' && !mongoose.isValidObjectId(input.patientAccountId)) {
    throw createError('A valid patient account is required', 400)
  }
  if (creating && input.accountMode === 'STANDALONE' && input.patientAccountId !== undefined) {
    throw createError('Standalone donors cannot be linked to a patient account', 400)
  }
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  if (name.length < 2 || name.length > 100) throw createError('Name must be between 2 and 100 characters', 400)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError('A valid email is required', 400)
  const phoneDigits = phone.replace(/\D/g, '')
  if (!/^\+?[0-9][0-9\s()-]*$/.test(phone) || phone.length > 20 || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw createError('Phone must contain 7 to 15 digits and only standard phone characters', 400)
  }
  if (typeof input.bloodGroup !== 'string' || !BLOOD_GROUPS.has(input.bloodGroup)) throw createError('Invalid blood group', 400)
  if (!AVAILABILITY_STATUSES.has(input.availability)) throw createError('Invalid donor availability', 400)
  if (!input.location || typeof input.location !== 'object' || Array.isArray(input.location)) {
    throw createError('Location must be an object', 400)
  }
  const allowedLocationFields = new Set(['division', 'district', 'upazila'])
  for (const field of Object.keys(input.location)) {
    if (!allowedLocationFields.has(field)) throw createError(`Location field is not allowed: ${field}`, 400)
  }
  const location = {}
  for (const field of allowedLocationFields) {
    const value = input.location[field]
    if (typeof value !== 'string' || value.trim().length > 100) {
      throw createError(`Location ${field} must be a string up to 100 characters`, 400)
    }
    location[field] = value.trim()
  }
  if (!location.division || !location.district || !location.upazila) throw createError('Division, district, and upazila are required', 400)
  let lastDonationDate = null
  if (input.lastDonationDate !== undefined && input.lastDonationDate !== null && input.lastDonationDate !== '') {
    if (typeof input.lastDonationDate !== 'string') throw createError('Last donation date must be a valid date', 400)
    lastDonationDate = new Date(input.lastDonationDate)
    if (Number.isNaN(lastDonationDate.getTime()) || lastDonationDate > new Date()) {
      throw createError('Last donation date must be a valid date no later than today', 400)
    }
  }
  if (input.preferredContactMethod !== undefined && typeof input.preferredContactMethod !== 'string') {
    throw createError('Preferred contact method must be a string', 400)
  }
  if (input.phoneConsent !== undefined && typeof input.phoneConsent !== 'boolean') {
    throw createError('Phone sharing consent must be a boolean', 400)
  }
  const preferredContactMethod = input.preferredContactMethod || ''
  if (preferredContactMethod && !CONTACT_METHODS.has(preferredContactMethod)) {
    throw createError('Invalid preferred contact method', 400)
  }
  const notes = input.notes === undefined ? '' : input.notes
  if (typeof notes !== 'string' || notes.trim().length > 1000) throw createError('Notes must be a string up to 1000 characters', 400)
  return {
    name,
    email,
    phone,
    bloodGroup: input.bloodGroup,
    location,
    availability: input.availability,
    lastDonationDate,
    preferredContactMethod,
    phoneConsent: input.phoneConsent === true,
    notes: notes.trim(),
    accountMode: input.accountMode,
    patientAccountId: input.patientAccountId,
  }
}

async function createDonor(input, actor) {
  requirePermission(actor, 'blood.moderate')
  const data = validateDonorInput(input, true)
  let donor
  try {
    if (data.accountMode === 'EXISTING_PATIENT') {
      donor = await User.findOne({ _id: data.patientAccountId, role: 'PATIENT' })
      if (!donor) throw createError('Patient account not found', 404)
      if (donor.accountStatus !== 'ACTIVE') throw createError('Inactive accounts cannot be added as donors', 409)
      if (donor.phone && donor.phone !== data.phone) {
        throw createError('The phone number must match the selected patient account', 409)
      }
      const phoneOwner = await User.findOne({ phone: data.phone })
      if (phoneOwner && phoneOwner._id.toString() !== donor._id.toString()) {
        throw createError('This phone number is already registered to another account', 409)
      }

      donor.name = data.name
      donor.phone = data.phone
      donor.bloodGroup = data.bloodGroup
      donor.location = data.location
      donor.role = 'BLOOD_DONOR'
      donor.donorStandalone = false
      donor.donorAvailability = data.availability
      donor.donorVerificationStatus = 'PENDING'
      donor.donorVerificationReason = ''
      donor.donorVerifiedAt = null
      donor.donorSuspendedAt = null
      donor.donorPreviousVerificationStatus = undefined
      donor.donorLastDonationDate = data.lastDonationDate
      donor.donorPreferredContactMethod = data.preferredContactMethod || undefined
      donor.donorPhoneConsent = data.phoneConsent
      donor.donorNotes = data.notes
      await donor.save()
    } else {
      const existingAccount = await User.findOne({ phone: data.phone })
      if (existingAccount) {
        throw createError('This phone number already belongs to an account. Select that patient account instead.', 409)
      }
      const donorId = new mongoose.Types.ObjectId()
      donor = await createUserWithPublicId({
        _id: donorId,
        name: data.name,
        email: `donor-${donorId.toString()}@standalone.invalid`,
        phone: data.phone,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        role: 'BLOOD_DONOR',
        donorStandalone: true,
        bloodGroup: data.bloodGroup,
        location: data.location,
        donorAvailability: data.availability,
        donorVerificationStatus: 'PENDING',
        donorVerificationReason: '',
        donorLastDonationDate: data.lastDonationDate,
        donorPreferredContactMethod: data.preferredContactMethod || undefined,
        donorPhoneConsent: data.phoneConsent,
        donorNotes: data.notes,
        accountStatus: 'ACTIVE',
        emailVerified: false,
      }, User)
    }
  } catch (error) {
    if (error.statusCode) throw error
    if (error.code === 11000) throw createError('This phone number is already registered', 409)
    throw error
  }
  await writeAudit(actor, donor, 'DONOR_CREATED', { bloodGroup: donor.bloodGroup, accountMode: data.accountMode })
  return buildDonorResponse(donor, true)
}

async function updateDonor(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  const data = validateDonorInput(input)
  if (!mongoose.isValidObjectId(id)) throw createError('Donor not found', 404)
  const donor = await User.findOne({ _id: id, role: 'BLOOD_DONOR' })
  if (!donor) throw createError('Donor not found', 404)
  if (data.availability === 'AVAILABLE' && ['REJECTED', 'SUSPENDED'].includes(getDonorVerificationStatus(donor))) {
    throw createError('Rejected or suspended donors cannot be marked available', 409)
  }
  const previousEmail = donor.email
  const changedFields = ['name', 'phone', 'bloodGroup', 'location', 'donorAvailability', 'donorLastDonationDate', 'donorPreferredContactMethod', 'donorPhoneConsent', 'donorNotes']
  donor.name = data.name
  if (data.email) donor.email = data.email
  donor.phone = data.phone
  donor.bloodGroup = data.bloodGroup
  donor.location = data.location
  donor.donorAvailability = data.availability
  donor.donorLastDonationDate = data.lastDonationDate
  donor.donorPreferredContactMethod = data.preferredContactMethod || undefined
  donor.donorPhoneConsent = data.phoneConsent
  donor.donorNotes = data.notes
  try {
    await donor.save()
  } catch (error) {
    if (error.code === 11000) throw createError('This email or phone number is already registered', 409)
    throw error
  }
  if (data.email && data.email !== previousEmail) changedFields.push('email')
  await writeAudit(actor, donor, 'DONOR_UPDATED', { changedFields })
  return buildDonorResponse(donor, true)
}

async function updateDonorAvailability(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(input, new Set(['availability']), 'Donor availability')
  const { availability } = input
  if (!AVAILABILITY_STATUSES.has(availability)) throw createError('Invalid donor availability', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Donor not found', 404)
  const donor = await User.findOne({ _id: id, role: 'BLOOD_DONOR' })
  if (!donor) throw createError('Donor not found', 404)
  if (availability === 'AVAILABLE' && ['REJECTED', 'SUSPENDED'].includes(getDonorVerificationStatus(donor))) {
    throw createError('Rejected or suspended donors cannot be marked available', 409)
  }
  const previousAvailability = getDonorAvailability(donor)
  if (previousAvailability === availability) throw createError(`Donor is already ${availability.toLowerCase()}`, 409)
  donor.donorAvailability = availability
  await donor.save()
  await writeAudit(actor, donor, 'DONOR_AVAILABILITY_UPDATED', { previousAvailability, nextAvailability: availability })
  return buildDonorResponse(donor, true)
}

async function verifyDonor(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(input, new Set(['status', 'reason']), 'Donor verification')
  const status = input.status || 'VERIFIED'
  if (!['VERIFIED', 'REJECTED'].includes(status)) throw createError('Invalid verification decision', 400)
  const reason = input.reason === undefined ? '' : input.reason
  if (typeof reason !== 'string' || reason.trim().length > 500) throw createError('Verification reason must be a string up to 500 characters', 400)
  if (status === 'REJECTED' && !reason.trim()) throw createError('A reason is required to reject verification', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Donor not found', 404)
  const donor = await User.findOne({ _id: id, role: 'BLOOD_DONOR' })
  if (!donor) throw createError('Donor not found', 404)
  if (getDonorVerificationStatus(donor) === 'SUSPENDED') throw createError('Restore the donor before verification', 409)
  if (getDonorVerificationStatus(donor) !== 'PENDING') throw createError('Only pending donors can be reviewed', 409)
  donor.donorVerificationStatus = status
  donor.donorVerificationReason = status === 'REJECTED' ? reason.trim() : ''
  donor.donorVerifiedAt = status === 'VERIFIED' ? new Date() : null
  donor.donorAvailability = 'UNAVAILABLE'
  await donor.save()
  await writeAudit(actor, donor, status === 'VERIFIED' ? 'DONOR_VERIFIED' : 'DONOR_REJECTED', {
    previousStatus: 'PENDING', nextStatus: status, reason: status === 'REJECTED' ? reason.trim() : undefined,
  })
  return buildDonorResponse(donor, true)
}

async function updateDonorStatus(id, input, actor) {
  requirePermission(actor, 'blood.moderate')
  validateObjectInput(input, new Set(['status']), 'Donor status')
  const { status } = input
  if (!['SUSPEND', 'RESTORE'].includes(status)) throw createError('Invalid donor status action', 400)
  if (!mongoose.isValidObjectId(id)) throw createError('Donor not found', 404)
  const donor = await User.findOne({ _id: id, role: 'BLOOD_DONOR' })
  if (!donor) throw createError('Donor not found', 404)

  if (status === 'SUSPEND') {
    if (getDonorVerificationStatus(donor) === 'SUSPENDED') throw createError('Donor is already suspended', 409)
    const previousStatus = getDonorVerificationStatus(donor)
    const previousAvailability = getDonorAvailability(donor)
    donor.donorVerificationStatus = 'SUSPENDED'
    donor.donorPreviousVerificationStatus = previousStatus
    donor.donorSuspendedAt = new Date()
    donor.donorVerifiedAt = null
    donor.donorAvailability = 'UNAVAILABLE'
    await donor.save()
    await writeAudit(actor, donor, 'DONOR_SUSPENDED', {
      previousStatus,
      nextStatus: 'SUSPENDED',
      previousAvailability,
      nextAvailability: 'UNAVAILABLE',
    })
  } else {
    if (getDonorVerificationStatus(donor) !== 'SUSPENDED') throw createError('Only suspended donors can be restored', 409)
    const restoredStatus = donor.donorPreviousVerificationStatus || 'VERIFIED'
    donor.donorVerificationStatus = restoredStatus
    donor.donorSuspendedAt = null
    donor.donorPreviousVerificationStatus = undefined
    donor.donorVerifiedAt = restoredStatus === 'VERIFIED' ? new Date() : null
    donor.donorAvailability = 'UNAVAILABLE'
    await donor.save()
    await writeAudit(actor, donor, 'DONOR_RESTORED', {
      previousStatus: 'SUSPENDED',
      nextStatus: restoredStatus,
      nextAvailability: 'UNAVAILABLE',
    })
  }
  return buildDonorResponse(donor, true)
}

module.exports = {
  getDonors,
  getPatientAccounts,
  getDonorById,
  createDonor,
  updateDonor,
  updateDonorAvailability,
  verifyDonor,
  updateDonorStatus,
}
const User = require('../models/User')

const BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const QUERY_FIELDS = new Set(['page', 'limit', 'search', 'bloodGroup', 'division', 'district', 'upazila', 'availability', 'availableOnly'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function validateQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw createError('Invalid donor search query.', 400)
  for (const field of Object.keys(query)) {
    if (!QUERY_FIELDS.has(field)) throw createError(`Unsupported donor search filter: ${field}`, 400)
  }

  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createError('Invalid pagination values.', 400)
  }

  const filter = {
    role: 'BLOOD_DONOR',
    accountStatus: 'ACTIVE',
    donorVerificationStatus: 'VERIFIED',
  }

  if (query.search !== undefined && query.search !== '') {
    if (typeof query.search !== 'string' || query.search.trim().length > 100) throw createError('Invalid search filter.', 400)
    const search = escapeRegex(query.search.trim())
    if (search) {
      const pattern = { $regex: search, $options: 'i' }
      filter.$or = [
        { name: pattern },
        { 'location.division': pattern },
        { 'location.district': pattern },
        { 'location.upazila': pattern },
      ]
    }
  }

  if (query.bloodGroup !== undefined && query.bloodGroup !== '') {
    if (typeof query.bloodGroup !== 'string' || !BLOOD_GROUPS.has(query.bloodGroup)) {
      throw createError('Invalid blood group filter.', 400)
    }
    filter.bloodGroup = query.bloodGroup
  }

  if (query.availability !== undefined && query.availability !== '') {
    if (!['AVAILABLE', 'UNAVAILABLE'].includes(query.availability)) throw createError('Invalid availability filter.', 400)
    filter.donorAvailability = query.availability
  }

  for (const field of ['division', 'district', 'upazila']) {
    const value = query[field]
    if (value === undefined || value === '') continue
    if (typeof value !== 'string' || value.trim().length > 100) throw createError(`Invalid ${field} filter.`, 400)
    if (value.trim()) filter[`location.${field}`] = { $regex: escapeRegex(value.trim()), $options: 'i' }
  }

  if (query.availableOnly !== undefined && query.availableOnly !== '') {
    if (!['true', 'false', true, false].includes(query.availableOnly)) throw createError('Invalid availability filter.', 400)
    if (query.availableOnly === 'true' || query.availableOnly === true) {
      if (query.availability === 'UNAVAILABLE') throw createError('Conflicting availability filters.', 400)
      filter.donorAvailability = 'AVAILABLE'
    }
  }

  return { filter, page, limit }
}

function buildPublicDonorResponse(donor, phone = '') {
  const response = {
    id: donor._id.toString(),
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    location: {
      division: donor.location?.division || '',
      district: donor.location?.district || '',
      upazila: donor.location?.upazila || '',
    },
    availability: donor.donorAvailability || 'UNAVAILABLE',
    verificationStatus: donor.donorVerificationStatus,
    phoneConsent: donor.donorPhoneConsent === true,
  }
  if (response.phoneConsent && phone) response.phone = phone
  return response
}

async function getPublicDonors(query = {}) {
  const { filter, page, limit } = validateQuery(query)
  const [donors, total] = await Promise.all([
    User.find(filter)
      .select('_id name bloodGroup location donorAvailability donorVerificationStatus donorPhoneConsent')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])
  const consentedIds = donors.filter((donor) => donor.donorPhoneConsent === true).map((donor) => donor._id)
  const consentedDonors = consentedIds.length
    ? await User.find({ _id: { $in: consentedIds }, donorPhoneConsent: true }).select('_id phone').lean()
    : []
  const phonesById = new Map(consentedDonors.map((donor) => [donor._id.toString(), donor.phone || '']))

  return {
    donors: donors.map((donor) => buildPublicDonorResponse(donor, phonesById.get(donor._id.toString()))),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

module.exports = { getPublicDonors }
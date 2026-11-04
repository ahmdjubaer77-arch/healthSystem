const mongoose = require('mongoose')
const MedicineAvailability = require('../models/MedicineAvailability')
const Provider = require('../models/Provider')
const AdminAuditLog = require('../models/AdminAuditLog')

const AVAILABILITY_VALUES = new Set(['AVAILABLE', 'UNAVAILABLE'])
const EDITABLE_FIELDS = new Set(['name', 'genericName', 'strength', 'dosageForm', 'availability'])
const PUBLIC_QUERY_FIELDS = new Set(['search', 'location', 'division', 'district', 'upazila', 'page', 'limit'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(value, field, maxLength, required = false) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string') throw createError(`${field} must be a string`, 400)
  const normalized = value.trim()
  if (required && !normalized) throw createError(`${field} is required`, 400)
  if (normalized.length > maxLength) throw createError(`${field} is too long`, 400)
  return normalized
}

function validateInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A medicine availability object is required', 400)
  }
  for (const field of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(field)) throw createError(`Medicine field cannot be changed: ${field}`, 400)
  }

  const definitions = {
    name: [160, !partial],
    genericName: [160, false],
    strength: [80, !partial],
    dosageForm: [80, !partial],
  }
  const medicine = {}
  for (const [field, [maxLength, required]] of Object.entries(definitions)) {
    if (input[field] !== undefined || required) {
      medicine[field] = normalizeText(input[field], field, maxLength, required)
    }
  }
  if (input.availability !== undefined) {
    if (typeof input.availability !== 'string' || !AVAILABILITY_VALUES.has(input.availability)) {
      throw createError('Invalid medicine availability', 400)
    }
    medicine.availability = input.availability
  } else if (!partial) {
    medicine.availability = 'AVAILABLE'
  }
  if (partial && Object.keys(medicine).length === 0) {
    throw createError('At least one medicine field is required', 400)
  }
  return medicine
}

function validateId(value, message) {
  if (!mongoose.isValidObjectId(value)) throw createError(message, 404)
}

function buildMedicineResponse(medicine) {
  return {
    id: medicine._id.toString(),
    pharmacyId: medicine.pharmacyId.toString(),
    name: medicine.name,
    genericName: medicine.genericName || '',
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
    availability: medicine.availability,
    updatedAt: medicine.updatedAt,
  }
}

async function getPharmacy(pharmacyId) {
  validateId(pharmacyId, 'Pharmacy not found')
  const pharmacy = await Provider.findOne({ _id: pharmacyId, providerType: 'Pharmacy' }).lean()
  if (!pharmacy) throw createError('Pharmacy not found', 404)
  return pharmacy
}

async function writeAudit(actor, pharmacy, medicine, action, fields = []) {
  await AdminAuditLog.create({
    actorId: actor.userId,
    actorRole: actor.role,
    action: `pharmacy.inventory.${action}`,
    entityType: 'Provider',
    entityId: pharmacy._id,
    result: 'SUCCESS',
    details: { medicineId: medicine._id, medicineName: medicine.name, fields },
    ipAddress: actor.ipAddress || null,
    userAgent: actor.userAgent || null,
  })
}

async function listPharmacyInventory(pharmacyId) {
  await getPharmacy(pharmacyId)
  const medicines = await MedicineAvailability.find({ pharmacyId }).sort({ name: 1, strength: 1 }).lean()
  return medicines.map(buildMedicineResponse)
}

async function createPharmacyMedicine(pharmacyId, input, actor) {
  const pharmacy = await getPharmacy(pharmacyId)
  const medicine = await MedicineAvailability.create({ ...validateInput(input), pharmacyId: pharmacy._id })
  await writeAudit(actor, pharmacy, medicine, 'added', Object.keys(input))
  return buildMedicineResponse(medicine)
}

async function updatePharmacyMedicine(pharmacyId, medicineId, input, actor) {
  const pharmacy = await getPharmacy(pharmacyId)
  validateId(medicineId, 'Medicine record not found')
  const updates = validateInput(input, { partial: true })
  const medicine = await MedicineAvailability.findOne({ _id: medicineId, pharmacyId })
  if (!medicine) throw createError('Medicine record not found', 404)
  for (const [field, value] of Object.entries(updates)) medicine.set(field, value)
  await medicine.save()
  await writeAudit(actor, pharmacy, medicine, 'updated', Object.keys(updates))
  return buildMedicineResponse(medicine)
}

async function deletePharmacyMedicine(pharmacyId, medicineId, actor) {
  const pharmacy = await getPharmacy(pharmacyId)
  validateId(medicineId, 'Medicine record not found')
  const medicine = await MedicineAvailability.findOne({ _id: medicineId, pharmacyId })
  if (!medicine) throw createError('Medicine record not found', 404)
  await MedicineAvailability.deleteOne({ _id: medicineId, pharmacyId })
  await writeAudit(actor, pharmacy, medicine, 'removed')
  return { id: medicine._id.toString() }
}

function parsePublicQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw createError('A medicine search query is required', 400)
  }
  for (const field of Object.keys(query)) {
    if (!PUBLIC_QUERY_FIELDS.has(field)) throw createError(`Unsupported medicine search field: ${field}`, 400)
  }
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? 20 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw createError('Page must be a positive integer', 400)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw createError('Limit must be an integer between 1 and 100', 400)
  }
  const filters = {}
  for (const field of ['search', 'location', 'division', 'district', 'upazila']) {
    if (query[field] === undefined || query[field] === '') continue
    if (typeof query[field] !== 'string') throw createError(`${field} must be a string`, 400)
    filters[field] = query[field].trim()
    if (filters[field].length > 120) throw createError(`${field} is too long`, 400)
  }
  return { page, limit, filters }
}

async function searchMedicineAvailability(query = {}) {
  const { page, limit, filters } = parsePublicQuery(query)
  const pharmacyFilter = { providerType: 'Pharmacy', verificationStatus: 'VERIFIED' }
  const locationConditions = []
  for (const field of ['division', 'district', 'upazila']) {
    if (!filters[field]) continue
    locationConditions.push({ [field]: { $regex: escapeRegex(filters[field]), $options: 'i' } })
  }
  if (filters.location) {
    const locationPattern = { $regex: escapeRegex(filters.location), $options: 'i' }
    locationConditions.push({ $or: [
      { address: locationPattern },
      { division: locationPattern },
      { district: locationPattern },
      { upazila: locationPattern },
    ] })
  }
  if (locationConditions.length) pharmacyFilter.$and = locationConditions

  const pharmacies = await Provider.find(pharmacyFilter).lean()
  if (!pharmacies.length) {
    return { medicines: [], pagination: { page, limit, total: 0, pages: 0 } }
  }
  const pharmacyById = new Map(pharmacies.map((pharmacy) => [pharmacy._id.toString(), pharmacy]))
  const pharmacyIds = [...pharmacyById.keys()]
  const medicineFilter = { pharmacyId: { $in: pharmacyIds } }
  if (filters.search) {
    const escapedSearch = escapeRegex(filters.search)
    const pattern = { $regex: escapedSearch, $options: 'i' }
    const matcher = new RegExp(escapedSearch, 'i')
    const matchingPharmacies = pharmacies
      .filter((pharmacy) => matcher.test(pharmacy.name || ''))
      .map((pharmacy) => pharmacy._id.toString())
    medicineFilter.$or = [
      { name: pattern },
      { genericName: pattern },
      { strength: pattern },
      { dosageForm: pattern },
      ...(matchingPharmacies.length ? [{ pharmacyId: { $in: matchingPharmacies } }] : []),
    ]
  }

  const [records, total] = await Promise.all([
    MedicineAvailability.find(medicineFilter)
      .sort({ availability: 1, updatedAt: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MedicineAvailability.countDocuments(medicineFilter),
  ])
  return {
    medicines: records.map((medicine) => {
      const pharmacy = pharmacyById.get(medicine.pharmacyId.toString())
      return {
        ...buildMedicineResponse(medicine),
        pharmacy: {
          id: pharmacy._id.toString(),
          name: pharmacy.name,
          contactPhone: pharmacy.contactPhone || '',
          contactEmail: pharmacy.contactEmail || '',
          address: pharmacy.address || '',
          division: pharmacy.division || '',
          district: pharmacy.district || '',
          upazila: pharmacy.upazila || '',
        },
      }
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

module.exports = {
  listPharmacyInventory,
  createPharmacyMedicine,
  updatePharmacyMedicine,
  deletePharmacyMedicine,
  searchMedicineAvailability,
}

const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const pharmacyService = require('../src/services/admin.pharmacy.service')

const providers = []
const auditEntries = []
const originalMethods = {
  create: Provider.create,
  find: Provider.find,
  findOne: Provider.findOne,
  countDocuments: Provider.countDocuments,
  auditCreate: AdminAuditLog.create,
}

function toPlain(provider) {
  return { ...provider, submittedDocuments: provider.submittedDocuments.map((document) => ({ ...document })) }
}

function matches(provider, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(provider, condition))
    if (key === '$or') return expected.some((condition) => matches(provider, condition))
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(provider[key] || '')
    return provider[key]?.toString() === expected?.toString()
  })
}

function createProvider(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    verificationStatus: 'PENDING',
    verificationReason: '',
    submittedDocuments: [{ documentType: 'license', fileName: 'license.pdf', storageId: 'private-storage-id' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    set(field, value) { this[field] = value },
    async save() { this.updatedAt = new Date(); return this },
  }
}

function installModelStubs() {
  Provider.create = async (data) => {
    const provider = createProvider(data)
    providers.push(provider)
    return provider
  }
  Provider.find = (filter) => {
    let result = providers.filter((provider) => matches(provider, filter))
    return {
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map(toPlain)) },
    }
  }
  Provider.findOne = (filter) => {
    const provider = providers.find((entry) => matches(entry, filter)) || null
    return {
      lean() { return Promise.resolve(provider ? toPlain(provider) : null) },
      then(resolve, reject) { return Promise.resolve(provider).then(resolve, reject) },
    }
  }
  Provider.countDocuments = async (filter) => providers.filter((provider) => matches(provider, filter)).length
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

installModelStubs()

after(() => {
  Provider.create = originalMethods.create
  Provider.find = originalMethods.find
  Provider.findOne = originalMethods.findOne
  Provider.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
})

test('pharmacy CRUD, verification, moderation, audit, and private document handling', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'ADMIN', ipAddress: '127.0.0.1' }
  const created = await pharmacyService.createPharmacy({
    name: 'Central Pharmacy',
    address: '12 Main Road',
    contactEmail: 'hello@example.com',
    district: 'Dhaka',
    licenseNumber: 'LIC-100',
  }, actor)

  assert.equal(created.verificationStatus, 'PENDING')
  assert.equal(Object.hasOwn(created, 'submittedDocuments'), false)
  assert.equal(Object.hasOwn(created, 'storageId'), false)
  await assert.rejects(
    pharmacyService.createPharmacy({ name: 'Bad Pharmacy', address: 'Road', submittedDocuments: [] }, actor),
    { statusCode: 400 },
  )
  await assert.rejects(
    pharmacyService.createPharmacy({ name: 'Bad Pharmacy', address: 'Road', contactEmail: 'bad-email' }, actor),
    { statusCode: 400 },
  )

  const hospital = createProvider({ providerType: 'Hospital', name: 'Not a pharmacy' })
  providers.push(hospital)
  const list = await pharmacyService.getPharmacies({ search: 'Central', location: 'Dhaka', page: '1', limit: '20' })
  assert.equal(list.pagination.total, 1)
  assert.equal(list.pharmacies[0].id, created.id)
  assert.equal((await pharmacyService.getPharmacies({ verificationStatus: 'PENDING' })).pagination.total, 1)
  await assert.rejects(pharmacyService.getPharmacies({ verificationStatus: 'UNDER_REVIEW' }), { statusCode: 400 })
  assert.equal((await pharmacyService.getPharmacyById(created.id)).name, 'Central Pharmacy')
  await assert.rejects(pharmacyService.getPharmacyById(hospital._id.toString()), { statusCode: 404 })

  const updated = await pharmacyService.updatePharmacy(created.id, { contactPhone: '+8801000000000' }, actor)
  assert.equal(updated.contactPhone, '+8801000000000')
  await assert.rejects(pharmacyService.updatePharmacy(created.id, { verificationStatus: 'VERIFIED' }, actor), { statusCode: 400 })

  const verified = await pharmacyService.updatePharmacyVerification(created.id, { status: 'VERIFIED', reason: '' }, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  assert.ok(verified.verifiedAt)
  await assert.rejects(pharmacyService.updatePharmacyVerification(created.id, { status: 'REJECTED', reason: '' }, actor), { statusCode: 400 })
  const rejected = await pharmacyService.updatePharmacyVerification(created.id, { status: 'REJECTED', reason: 'License details do not match' }, actor)
  assert.equal(rejected.verificationStatus, 'REJECTED')
  assert.equal(rejected.verificationReason, 'License details do not match')
  assert.equal(rejected.verifiedAt, null)

  const suspended = await pharmacyService.updatePharmacyStatus(created.id, { status: 'SUSPENDED' }, actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  await assert.rejects(pharmacyService.updatePharmacyVerification(created.id, { status: 'VERIFIED', reason: '' }, actor), { statusCode: 409 })
  const restored = await pharmacyService.updatePharmacyStatus(created.id, { status: 'RESTORE' }, actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')
  assert.equal(restored.verificationReason, '')
  await assert.rejects(pharmacyService.updatePharmacyStatus(created.id, { status: 'RESTORE' }, actor), { statusCode: 409 })

  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'pharmacy.created', 'pharmacy.updated', 'pharmacy.verified', 'pharmacy.rejected',
    'pharmacy.suspended', 'pharmacy.restored',
  ])
})
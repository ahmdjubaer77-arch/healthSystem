const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const adminHospitalService = require('../src/services/admin.hospital.service')
const hospitalController = require('../src/controllers/hospital.controller')

const providers = []
const auditEntries = []
const originalMethods = {
  create: Provider.create,
  find: Provider.find,
  findOne: Provider.findOne,
  countDocuments: Provider.countDocuments,
  distinct: Provider.distinct,
  auditCreate: AdminAuditLog.create,
}

function createProvider(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    providerType: 'Hospital',
    verificationStatus: 'PENDING',
    verificationReason: '',
    verifiedAt: null,
    suspendedAt: null,
    submittedDocuments: [{ storageId: 'private-document-id' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    set(field, value) { this[field] = value },
    async save() { this.updatedAt = new Date(); return this },
  }
}

function matches(provider, filter) {
  return Object.entries(filter).every(([field, expected]) => {
    if (field === '$and') return expected.every((condition) => matches(provider, condition))
    if (field === '$or') return expected.some((condition) => matches(provider, condition))
    const value = provider[field]
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    return value?.toString() === expected?.toString()
  })
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
      select() { return this },
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map((provider) => ({ ...provider }))) },
    }
  }
  Provider.findOne = (filter) => {
    const provider = providers.find((entry) => matches(entry, filter)) || null
    return {
      select() { return this },
      lean() { return Promise.resolve(provider ? { ...provider } : null) },
      then(resolve, reject) { return Promise.resolve(provider).then(resolve, reject) },
    }
  }
  Provider.countDocuments = async (filter) => providers.filter((provider) => matches(provider, filter)).length
  Provider.distinct = async (field, filter) => [...new Set(providers.filter((provider) => matches(provider, filter)).map((provider) => field.split('.').reduce((value, key) => value?.[key], provider)).filter(Boolean))]
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

installModelStubs()

after(() => {
  Provider.create = originalMethods.create
  Provider.find = originalMethods.find
  Provider.findOne = originalMethods.findOne
  Provider.countDocuments = originalMethods.countDocuments
  Provider.distinct = originalMethods.distinct
  AdminAuditLog.create = originalMethods.auditCreate
})

function invokeController(handler, req) {
  let statusCode
  let body
  const res = {
    status(code) { statusCode = code; return this },
    json(value) { body = value; return this },
  }
  return handler(req, res, (error) => { throw error }).then(() => ({ statusCode, body }))
}

test('Admin Provider hospital remains hidden while pending, then appears in public list and detail after verification', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'ADMIN' }
  const created = await adminHospitalService.createHospital({
    name: 'Cedar Town Hospital',
    address: '12 Cedar Street',
    contactEmail: 'private@cedar.example',
    contactPhone: '+8801700000000',
    division: 'Dhaka',
    district: 'Dhaka District',
    upazila: 'Uttara',
    licenseNumber: 'LIC-PRIVATE',
  }, actor)
  assert.equal(created.verificationStatus, 'PENDING')

  const pendingList = await invokeController(hospitalController.getPublicHospitals, { query: { search: 'Cedar Town' }, params: {} })
  assert.equal(pendingList.statusCode, 200)
  assert.equal(pendingList.body.data.pagination.total, 0)

  const verified = await adminHospitalService.updateHospitalVerification(created.id, 'VERIFIED', '', actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')

  const divisionOptions = await invokeController(hospitalController.getPublicLocationOptions, { query: { category: 'hospitals' } })
  assert.deepEqual(divisionOptions.body.data.divisions, ['Dhaka'])
  const districtOptions = await invokeController(hospitalController.getPublicLocationOptions, { query: { category: 'hospitals', division: 'Dhaka' } })
  assert.deepEqual(districtOptions.body.data.districts, ['Dhaka District'])
  const invalidCategory = await invokeController(hospitalController.getPublicLocationOptions, { query: { category: 'unknown' } })
  assert.equal(invalidCategory.statusCode, 400)

  const listResponse = await invokeController(hospitalController.getPublicHospitals, {
    query: { search: 'cedar town', division: 'dHaKa', district: 'dhaka district', upazila: 'UTTARA', page: '1', limit: '1' },
    params: {},
  })
  assert.equal(listResponse.statusCode, 200)
  assert.equal(listResponse.body.data.pagination.total, 1)
  const listed = listResponse.body.data.hospitals[0]
  assert.equal(listed.id, created.id)
  assert.equal(listed.verificationStatus, 'VERIFIED')
  assert.equal(Object.hasOwn(listed, 'contactEmail'), false)
  assert.equal(Object.hasOwn(listed, 'licenseNumber'), false)
  assert.equal(Object.hasOwn(listed, 'submittedDocuments'), false)

  const detailResponse = await invokeController(hospitalController.getNearbyHospital, {
    params: { id: created.id },
    query: {},
  })
  assert.equal(detailResponse.statusCode, 200)
  assert.equal(detailResponse.body.data.hospital.name, 'Cedar Town Hospital')
  assert.equal(Object.hasOwn(detailResponse.body.data.hospital, 'contactEmail'), false)
  assert.equal(auditEntries.map((entry) => entry.action).join(','), 'hospital.created,hospital.verified')
})
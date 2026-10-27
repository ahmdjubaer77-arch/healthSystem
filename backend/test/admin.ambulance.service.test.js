const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const ambulanceService = require('../src/services/admin.ambulance.service')
const ambulanceController = require('../src/controllers/admin.ambulance.controller')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')

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
  return {
    ...provider,
    serviceAreas: [...provider.serviceAreas],
    vehicles: provider.vehicles.map((vehicle) => ({ ...vehicle, equipment: [...vehicle.equipment] })),
    submittedDocuments: provider.submittedDocuments.map((document) => ({ ...document })),
  }
}

function readPath(record, field) {
  return field.split('.').reduce((value, key) => {
    if (Array.isArray(value)) return value.map((entry) => entry?.[key]).flat()
    return value?.[key]
  }, record)
}

function matches(provider, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(provider, condition))
    if (key === '$or') return expected.some((condition) => matches(provider, condition))
    const value = readPath(provider, key)
    if (expected && expected.$in) return (Array.isArray(value) ? value : [value]).some((item) => expected.$in.includes(item))
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    return value?.toString() === expected?.toString()
  })
}

function createProvider(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    verificationStatus: 'PENDING',
    verificationReason: '',
    operationalStatus: 'OFFLINE',
    serviceAreas: [],
    vehicles: [],
    submittedDocuments: [{ documentType: 'provider-license', fileName: 'private.pdf', storageId: 'secret-storage-id' }],
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
      select() { return this },
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map(toPlain)) },
    }
  }
  Provider.findOne = (filter) => {
    const provider = providers.find((entry) => matches(entry, filter)) || null
    return {
      select() { return this },
      lean() { return Promise.resolve(provider ? toPlain(provider) : null) },
      then(resolve, reject) { return Promise.resolve(provider).then(resolve, reject) },
    }
  }
  Provider.countDocuments = async (filter) => providers.filter((provider) => matches(provider, filter)).length
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

async function invokeController(handler, request) {
  let statusCode
  let body
  const response = {
    status(code) { statusCode = code; return this },
    json(value) { body = value; return this },
  }
  await handler(request, response, (error) => { throw error })
  return { statusCode, body }
}

installModelStubs()

after(() => {
  Provider.create = originalMethods.create
  Provider.find = originalMethods.find
  Provider.findOne = originalMethods.findOne
  Provider.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
})

test('ambulance search, filters, vehicle view, authorization, and status workflows', async () => {
  for (const permission of ['ambulances.read', 'ambulances.verify', 'ambulances.update']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['ambulances.read', 'ambulances.verify', 'ambulances.update'],
    ipAddress: '127.0.0.1',
  }
  const ambulance = createProvider({
    name: 'Northside Response',
    providerType: 'Ambulance Provider',
    contactPhone: '+8801000000000',
    address: 'Central station',
    division: 'Dhaka',
    district: 'Dhaka',
    serviceAreas: ['Uttara', 'Mirpur'],
    vehicles: [{
      vehicleType: 'Advanced Life Support',
      registrationNumber: 'AMB-101',
      capacity: 2,
      equipment: ['Oxygen', 'Defibrillator'],
    }],
  })
  const otherAmbulance = createProvider({
    name: 'Southside Transport',
    providerType: 'Ambulance Provider',
    division: 'Chattogram',
    serviceAreas: ['Agrabad'],
    verificationStatus: 'VERIFIED',
    operationalStatus: 'BUSY',
  })
  const hospital = createProvider({ name: 'Not an ambulance', providerType: 'Hospital' })
  providers.push(ambulance, otherAmbulance, hospital)

  const searchResults = await ambulanceService.getAmbulances({ search: 'Northside', serviceArea: 'Uttara', page: '1', limit: '1' })
  assert.equal(searchResults.pagination.total, 1)
  assert.equal(searchResults.ambulances[0].id, ambulance._id.toString())
  assert.equal(searchResults.ambulances[0].operationalStatus, 'OFFLINE')
  assert.equal(searchResults.ambulances[0].vehicleCount, 1)
  assert.equal(Object.hasOwn(searchResults.ambulances[0], 'vehicles'), false)
  assert.equal(Object.hasOwn(searchResults.ambulances[0], 'submittedDocuments'), false)

  const page = await ambulanceService.getAmbulances({ page: '1', limit: '1' })
  assert.equal(page.pagination.total, 2)
  assert.equal(page.pagination.pages, 2)
  assert.equal((await ambulanceService.getAmbulances({ verificationStatus: 'VERIFIED' })).pagination.total, 1)
  assert.equal((await ambulanceService.getAmbulances({ operationalStatus: 'BUSY' })).pagination.total, 1)
  assert.equal((await ambulanceService.getAmbulances({ serviceArea: 'Chattogram' })).pagination.total, 1)
  await assert.rejects(ambulanceService.getAmbulances({ verificationStatus: 'UNDER_REVIEW' }), { statusCode: 400 })
  await assert.rejects(ambulanceService.getAmbulances({ unexpected: 'filter' }), { statusCode: 400 })

  const profile = await ambulanceService.getAmbulanceById(ambulance._id.toString())
  assert.equal(profile.vehicles.length, 1)
  assert.equal(profile.vehicles[0].vehicleType, 'Advanced Life Support')
  assert.deepEqual(profile.vehicles[0].equipment, ['Oxygen', 'Defibrillator'])
  assert.equal(Object.hasOwn(profile, 'submittedDocuments'), false)
  await assert.rejects(ambulanceService.getAmbulanceById(hospital._id.toString()), { statusCode: 404 })

  await assert.rejects(
    ambulanceService.updateAmbulanceOperationalStatus(ambulance._id.toString(), { operationalStatus: 'AVAILABLE' }, actor),
    { statusCode: 409 },
  )
  await assert.rejects(
    ambulanceService.updateAmbulanceOperationalStatus(ambulance._id.toString(), { operationalStatus: 'AVAILABLE' }, { permissions: [] }),
    { statusCode: 403 },
  )
  await assert.rejects(
    ambulanceService.updateAmbulanceVerification(ambulance._id.toString(), { status: 'REJECTED', reason: '' }, actor),
    { statusCode: 400 },
  )

  const verified = await ambulanceService.updateAmbulanceVerification(ambulance._id.toString(), { status: 'VERIFIED' }, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  assert.equal(verified.operationalStatus, 'OFFLINE')
  await ambulanceService.updateAmbulanceOperationalStatus(ambulance._id.toString(), { operationalStatus: 'AVAILABLE' }, actor)
  await ambulanceService.updateAmbulanceOperationalStatus(ambulance._id.toString(), { operationalStatus: 'BUSY' }, actor)
  await ambulanceService.updateAmbulanceOperationalStatus(ambulance._id.toString(), { operationalStatus: 'OFFLINE' }, actor)
  const rejected = await ambulanceService.updateAmbulanceVerification(ambulance._id.toString(), {
    status: 'REJECTED',
    reason: 'Vehicle inspection documentation is incomplete',
  }, actor)
  assert.equal(rejected.verificationStatus, 'REJECTED')
  assert.equal(rejected.operationalStatus, 'OFFLINE')
  const reverified = await ambulanceService.updateAmbulanceVerification(ambulance._id.toString(), { status: 'VERIFIED' }, actor)
  assert.equal(reverified.operationalStatus, 'OFFLINE')
  const suspended = await ambulanceService.updateAmbulanceStatus(ambulance._id.toString(), { status: 'SUSPENDED' }, actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  assert.equal(suspended.operationalStatus, 'OFFLINE')
  const restored = await ambulanceService.updateAmbulanceStatus(ambulance._id.toString(), { status: 'RESTORE' }, actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')
  assert.equal(restored.operationalStatus, 'OFFLINE')

  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'ambulance.verified',
    'ambulance.operational_status_updated',
    'ambulance.operational_status_updated',
    'ambulance.operational_status_updated',
    'ambulance.rejected',
    'ambulance.verified',
    'ambulance.suspended',
    'ambulance.restored',
  ])
})

test('ambulance add, edit, verify, public search/filter, details and call workflow', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN', permissions: ['ambulances.update', 'ambulances.verify'] }
  const input = {
    name: 'North Rescue Service',
    contactPhone: '+8801712345678',
    address: 'Central station',
    division: 'Dhaka',
    district: 'Dhaka District',
    upazila: 'Uttara',
    serviceAreas: ['Uttara', 'Tongi'],
    vehicles: [{ vehicleType: 'Advanced Life Support', registrationNumber: 'DHA-AMB-909', capacity: 2, equipment: ['Oxygen'] }],
  }
  const created = await ambulanceService.createAmbulance(input, actor)
  assert.equal(created.verificationStatus, 'PENDING')
  assert.equal(created.operationalStatus, 'OFFLINE')
  assert.equal(created.vehicles[0].vehicleType, 'Advanced Life Support')
  await assert.rejects(ambulanceService.createAmbulance(input, actor), { statusCode: 409 })
  await assert.rejects(ambulanceService.createAmbulance(input, { permissions: [] }), { statusCode: 403 })
  await assert.rejects(ambulanceService.createAmbulance({ ...input, contactPhone: 'not a phone' }, actor), { statusCode: 400 })
  assert.equal((await ambulanceService.getPublicAmbulances({ search: 'North Rescue' })).pagination.total, 0)

  const edited = await ambulanceService.updateAmbulance(created.id, { serviceAreas: ['Uttara', 'Airport'], vehicles: [{ vehicleType: 'Patient Transport', registrationNumber: 'DHA-AMB-909', capacity: 2 }] }, actor)
  assert.equal(edited.serviceAreas.includes('Airport'), true)
  const verified = await ambulanceService.updateAmbulanceVerification(created.id, { status: 'VERIFIED' }, actor)
  assert.equal(verified.operationalStatus, 'OFFLINE')
  await ambulanceService.updateAmbulanceOperationalStatus(created.id, { operationalStatus: 'AVAILABLE' }, actor)

  const listResponse = await invokeController(ambulanceController.getPublicAmbulances, { query: {
    search: 'Patient Transport', vehicleType: 'Transport', serviceArea: 'Airport', division: 'Dhaka', district: 'Dhaka District',
    upazila: 'Uttara', operationalStatus: 'AVAILABLE', page: '1', limit: '5',
  } })
  assert.equal(listResponse.statusCode, 200)
  assert.equal(listResponse.body.data.pagination.total, 1)
  const listed = listResponse.body.data.ambulances[0]
  assert.equal(listed.name, input.name)
  assert.equal(listed.contactPhone, input.contactPhone)
  assert.equal(listed.vehicles[0].vehicleType, 'Patient Transport')
  assert.equal(Object.hasOwn(listed, 'registrationNumber'), false)
  assert.equal(Object.hasOwn(listed, 'submittedDocuments'), false)

  const detailResponse = await invokeController(ambulanceController.getPublicAmbulance, { params: { id: created.id } })
  assert.equal(detailResponse.statusCode, 200)
  assert.equal(detailResponse.body.data.ambulance.contactPhone, input.contactPhone)
  await ambulanceService.updateAmbulanceStatus(created.id, { status: 'SUSPENDED' }, actor)
  assert.equal((await ambulanceService.getPublicAmbulances({ search: 'North Rescue' })).pagination.total, 0)
  await assert.rejects(ambulanceService.getPublicAmbulances({ operationalStatus: 'OFFLINE' }), { statusCode: 400 })
  assert.deepEqual(auditEntries.slice(-5).map((entry) => entry.action), [
    'ambulance.created', 'ambulance.updated', 'ambulance.verified', 'ambulance.operational_status_updated', 'ambulance.suspended',
  ])
})
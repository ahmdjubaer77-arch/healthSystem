const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const { cloudinary } = require('../src/config/cloudinary')
const doctorService = require('../src/services/admin.doctor.service')
const doctorController = require('../src/controllers/admin.doctor.controller')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')

const providers = []
const auditEntries = []
const originalMethods = {
  create: Provider.create,
  find: Provider.find,
  findOne: Provider.findOne,
  countDocuments: Provider.countDocuments,
  auditCreate: AdminAuditLog.create,
  privateDownloadUrl: cloudinary.utils.private_download_url,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}

function toPlain(provider) {
  return {
    ...provider,
    submittedDocuments: provider.submittedDocuments.map((document) => ({ ...document })),
  }
}

function matches(provider, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(provider, condition))
    if (key === '$or') return expected.some((condition) => matches(provider, condition))
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(provider[key] || '')
    if (expected && expected.$in) return expected.$in.includes(provider[key])
    return provider[key]?.toString() === expected?.toString()
  })
}

function createProvider(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    verificationStatus: 'PENDING',
    verificationReason: '',
    submittedDocuments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    set(field, value) { this[field] = value },
    async save() { this.updatedAt = new Date(); return this },
  }
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
  cloudinary.utils.private_download_url = (storageId, format, options) => {
    assert.equal(storageId, 'private/doctor-license')
    assert.equal(format, 'pdf')
    assert.equal(options.resource_type, 'raw')
    assert.equal(options.type, 'private')
    return 'https://cloudinary.example/short-lived-private-download'
  }
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.CLOUDINARY_API_KEY = 'test-key'
  process.env.CLOUDINARY_API_SECRET = 'test-secret'
}

installModelStubs()

after(() => {
  Provider.create = originalMethods.create
  Provider.find = originalMethods.find
  Provider.findOne = originalMethods.findOne
  Provider.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
  cloudinary.utils.private_download_url = originalMethods.privateDownloadUrl
  for (const [key, value] of Object.entries({
    CLOUDINARY_CLOUD_NAME: originalMethods.cloudName,
    CLOUDINARY_API_KEY: originalMethods.apiKey,
    CLOUDINARY_API_SECRET: originalMethods.apiSecret,
  })) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test('doctor search, filters, profile, credentials, and verification workflows', async () => {
  for (const permission of ['doctors.read', 'doctors.verify']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['doctors.read', 'doctors.verify'],
    ipAddress: '127.0.0.1',
  }
  const credentialId = new mongoose.Types.ObjectId()
  const doctor = createProvider({
    name: 'Dr. Ada Rahman',
    providerType: 'Doctor',
    specialty: 'Cardiology',
    contactEmail: 'ada@example.com',
    contactPhone: '+8801000000000',
    address: 'Central Medical Road',
    division: 'Dhaka',
    district: 'Dhaka',
    licenseNumber: 'BMDC-100',
    submittedDocuments: [{
      _id: credentialId,
      documentType: 'Medical license',
      fileName: 'license.pdf',
      storageId: 'private/doctor-license',
      uploadedAt: new Date(),
    }],
  })
  const dermatologist = createProvider({
    name: 'Dr. Noor Karim',
    providerType: 'Doctor',
    specialty: 'Dermatology',
    division: 'Chattogram',
    verificationStatus: 'VERIFIED',
  })
  const pharmacy = createProvider({ name: 'Not a doctor', providerType: 'Pharmacy' })
  providers.push(doctor, dermatologist, pharmacy)

  const searchResult = await doctorService.getDoctors({ search: 'Ada', location: 'Dhaka', page: '1', limit: '1' })
  assert.equal(searchResult.pagination.total, 1)
  assert.equal(searchResult.doctors[0].id, doctor._id.toString())
  assert.equal(searchResult.doctors[0].credentialCount, 1)
  assert.equal(Object.hasOwn(searchResult.doctors[0], 'submittedCredentials'), false)
  assert.equal((await doctorService.getDoctors({ specialty: 'Dermatology' })).doctors[0].id, dermatologist._id.toString())
  assert.equal((await doctorService.getDoctors({ verificationStatus: 'VERIFIED' })).pagination.total, 1)
  assert.equal((await doctorService.getDoctors({ location: 'Chattogram' })).pagination.total, 1)
  await assert.rejects(doctorService.getDoctors({ verificationStatus: 'UNDER_REVIEW' }), { statusCode: 400 })
  await assert.rejects(doctorService.getDoctors({ unexpected: 'value' }), { statusCode: 400 })

  const profile = await doctorService.getDoctorById(doctor._id.toString())
  assert.equal(profile.specialty, 'Cardiology')
  assert.equal(profile.submittedCredentials.length, 1)
  assert.equal(profile.submittedCredentials[0].id, credentialId.toString())
  assert.equal(Object.hasOwn(profile.submittedCredentials[0], 'storageId'), false)
  await assert.rejects(doctorService.getDoctorById(pharmacy._id.toString()), { statusCode: 404 })

  const download = await doctorService.getDoctorCredentialUrl(doctor._id.toString(), credentialId.toString(), actor)
  assert.match(download.url, /short-lived-private-download/)
  assert.ok(download.expiresAt > Math.floor(Date.now() / 1000))
  await assert.rejects(
    doctorService.getDoctorCredentialUrl(doctor._id.toString(), credentialId.toString(), { permissions: [] }),
    { statusCode: 403 },
  )

  await assert.rejects(
    doctorService.updateDoctorVerification(doctor._id.toString(), { status: 'REJECTED', reason: '' }, actor),
    { statusCode: 400 },
  )
  const verified = await doctorService.updateDoctorVerification(doctor._id.toString(), { status: 'VERIFIED' }, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  assert.ok(verified.verifiedAt)
  const rejected = await doctorService.updateDoctorVerification(doctor._id.toString(), {
    status: 'REJECTED',
    reason: 'License could not be validated',
  }, actor)
  assert.equal(rejected.verificationStatus, 'REJECTED')
  assert.equal(rejected.verificationReason, 'License could not be validated')
  const suspended = await doctorService.updateDoctorStatus(doctor._id.toString(), { status: 'SUSPENDED' }, actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  const restored = await doctorService.updateDoctorStatus(doctor._id.toString(), { status: 'RESTORE' }, actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')

  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'doctor.credential_viewed', 'doctor.verified', 'doctor.rejected', 'doctor.suspended', 'doctor.restored',
  ])
})

test('doctor add, edit, verification, public combined search, profile and contact workflow', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN', permissions: ['doctors.verify'] }
  const profile = {
    name: 'Dr. Samira Noor',
    specialty: 'Cardiology',
    qualification: 'MBBS, FCPS (Cardiology)',
    registrationNumber: 'BMDC-WORKFLOW-90210',
    experienceYears: 9,
    hospitalName: 'North Clinic',
    consultationFee: 850,
    division: 'Sylhet',
    district: 'Sylhet District',
    upazila: 'Jalalabad',
    contactPhone: '+8801712345678',
    operationalStatus: 'BUSY',
  }
  const created = await doctorService.createDoctor(profile, actor)
  assert.equal(created.verificationStatus, 'PENDING')
  assert.equal(created.availability, 'BUSY')
  await assert.rejects(doctorService.createDoctor(profile, actor), { statusCode: 409 })
  await assert.rejects(doctorService.createDoctor(profile, { permissions: [] }), { statusCode: 403 })
  await assert.rejects(doctorService.updateDoctor(created.id, { consultationFee: -1 }, actor), { statusCode: 400 })
  assert.equal((await doctorService.getPublicDoctors({ search: 'Samira' })).pagination.total, 0)

  const updated = await doctorService.updateDoctor(created.id, { experienceYears: 10, operationalStatus: 'AVAILABLE' }, actor)
  assert.equal(updated.experienceYears, 10)
  const verified = await doctorService.updateDoctorVerification(created.id, { status: 'VERIFIED' }, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')

  const directoryResponse = await invokeController(doctorController.getPublicDoctors, { query: {
    search: 'Samira Noor', name: 'Samira', specialty: 'Cardiology', hospitalName: 'North Clinic',
    division: 'Sylhet', district: 'Sylhet District', upazila: 'Jalalabad', availability: 'AVAILABLE', page: '1', limit: '5',
  } })
  assert.equal(directoryResponse.statusCode, 200)
  const found = directoryResponse.body.data
  assert.equal(found.pagination.total, 1)
  assert.equal(found.doctors[0].id, created.id)
  assert.equal(found.doctors[0].contactPhone, profile.contactPhone)
  assert.equal(found.doctors[0].verificationStatus, 'VERIFIED')
  assert.equal(Object.hasOwn(found.doctors[0], 'submittedDocuments'), false)
  assert.equal(Object.hasOwn(found.doctors[0], 'contactEmail'), false)

  const detailsResponse = await invokeController(doctorController.getPublicDoctor, { params: { id: created.id } })
  assert.equal(detailsResponse.statusCode, 200)
  const details = detailsResponse.body.data.doctor
  assert.equal(details.name, profile.name)
  assert.equal(details.consultationFee, profile.consultationFee)
  await doctorService.updateDoctorStatus(created.id, { status: 'SUSPENDED' }, actor)
  assert.equal((await doctorService.getPublicDoctors({ search: 'Samira' })).pagination.total, 0)
  await doctorService.updateDoctorStatus(created.id, { status: 'RESTORE' }, actor)
  assert.equal((await doctorService.getPublicDoctors({ search: 'Samira' })).pagination.total, 1)
  await assert.rejects(doctorService.getPublicDoctors({ availability: 'OFFLINE' }), { statusCode: 400 })
  await assert.rejects(doctorService.getPublicDoctors({ unrecognized: 'value' }), { statusCode: 400 })
  assert.deepEqual(auditEntries.slice(-5).map((entry) => entry.action), [
    'doctor.created', 'doctor.updated', 'doctor.verified', 'doctor.suspended', 'doctor.restored',
  ])
})
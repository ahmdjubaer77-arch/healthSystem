const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const User = require('../src/models/User')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const donorService = require('../src/services/admin.blood.donor.service')
const adminUserService = require('../src/services/admin.user.service')
const authService = require('../src/services/auth.service')
const publicDonorService = require('../src/services/blood.donor.service')
const publicDonorController = require('../src/controllers/blood.donor.controller')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')

const users = []
const auditEntries = []
const originalMethods = {
  find: User.find,
  findOne: User.findOne,
  create: User.create,
  countDocuments: User.countDocuments,
  auditCreate: AdminAuditLog.create,
}

function getPath(record, field) {
  return field.split('.').reduce((value, key) => value?.[key], record)
}

function matches(user, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(user, condition))
    if (key === '$or') return expected.some((condition) => matches(user, condition))
    const value = getPath(user, key)
    if (expected && expected.$in) return expected.$in.some((entry) => entry?.toString() === value?.toString())
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    if (expected && expected.$ne) return value?.toString() !== expected.$ne.toString()
    if (expected && expected.$exists !== undefined) return (value !== undefined) === expected.$exists
    return value?.toString() === expected?.toString()
  })
}

function createUser(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Patient Account',
    email: 'patient@example.com',
    phone: '+8801000000000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    bloodGroup: 'O+',
    location: {},
    passwordHash: 'private-password-hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    async save() { this.updatedAt = new Date(); return this },
  }
}

async function invokePublicDonorController(query) {
  let statusCode
  let body
  const response = {
    status(code) { statusCode = code; return this },
    json(value) { body = value; return this },
  }
  await publicDonorController.getPublicDonors({ query }, response, (error) => { throw error })
  return { statusCode, body }
}

function installModelStubs() {
  User.find = (filter) => {
    let result = users.filter((user) => matches(user, filter))
    return {
      select() { return this },
      sort() { return this },
      skip(count) { result = result.slice(count); return this },
      limit(count) { result = result.slice(0, count); return this },
      lean() { return Promise.resolve(result.map((user) => ({ ...user, location: { ...user.location } }))) },
    }
  }
  User.findOne = (filter) => {
    const user = users.find((entry) => matches(entry, filter)) || null
    return {
      select() { return this },
      lean() { return Promise.resolve(user ? { ...user, location: { ...user.location } } : null) },
      then(resolve, reject) { return Promise.resolve(user).then(resolve, reject) },
    }
  }
  User.create = async (data) => {
    const user = createUser(data)
    users.push(user)
    return user
  }
  User.countDocuments = async (filter) => users.filter((user) => matches(user, filter)).length
  AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }
}

installModelStubs()

after(() => {
  User.find = originalMethods.find
  User.findOne = originalMethods.findOne
  User.create = originalMethods.create
  User.countDocuments = originalMethods.countDocuments
  AdminAuditLog.create = originalMethods.auditCreate
})

test('blood donor management covers add, search, filters, view, verify, suspend, and restore', async () => {
  for (const permission of ['blood.read', 'blood.moderate']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['blood.read', 'blood.moderate'],
    ipAddress: '127.0.0.1',
  }
  const patient = createUser()
  const alternateDonor = createUser({
    name: 'Other Donor',
    email: 'other@example.com',
    phone: '+8801000000001',
    role: 'BLOOD_DONOR',
    bloodGroup: 'A+',
    location: { division: 'Chattogram', district: 'Chattogram', upazila: 'Pahartali' },
    donorAvailability: 'AVAILABLE',
    donorVerificationStatus: 'VERIFIED',
  })
  const legacyDonor = createUser({
    name: 'Legacy Donor',
    email: 'legacy@example.com',
    role: 'BLOOD_DONOR',
    bloodGroup: 'B+',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Mirpur' },
  })
  users.push(patient, alternateDonor, legacyDonor)

  const publicSearch = await publicDonorService.getPublicDonors({ search: 'Other Donor', bloodGroup: 'A+', division: 'Chattogram', district: 'Chattogram', upazila: 'Pahartali', availability: 'AVAILABLE' })
  assert.equal(publicSearch.pagination.total, 1)
  assert.equal(publicSearch.donors[0].name, 'Other Donor')
  assert.equal(publicSearch.donors[0].phoneConsent, false)
  assert.equal(Object.hasOwn(publicSearch.donors[0], 'phone'), false)

  const patientSearch = await donorService.getPatientAccounts({ search: 'Patient' }, actor)
  assert.deepEqual(patientSearch.patients.map(({ id, name, phone, bloodGroup }) => ({ id, name, phone, bloodGroup })), [
    { id: patient._id.toString(), name: patient.name, phone: patient.phone, bloodGroup: patient.bloodGroup },
  ])
  await assert.rejects(donorService.getPatientAccounts({ search: 'Patient' }, { permissions: [] }), { statusCode: 403 })

  const added = await donorService.createDonor({
    name: 'New Donor',
    accountMode: 'EXISTING_PATIENT',
    patientAccountId: patient._id.toString(),
    phone: patient.phone,
    bloodGroup: 'O+',
    availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor)
  assert.equal(added.id, patient._id.toString())
  assert.equal(patient.role, 'BLOOD_DONOR')
  assert.equal(added.verificationStatus, 'PENDING')
  assert.equal(added.availability, 'UNAVAILABLE')
  assert.equal(added.phoneConsent, false)
  assert.equal(auditEntries.at(-1).details.accountMode, 'EXISTING_PATIENT')
  await assert.rejects(donorService.createDonor({
    name: 'Credential Payload Donor', email: patient.email, phone: patient.phone, password: 'must-not-be-accepted',
    bloodGroup: 'O+', availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor), { statusCode: 400 })
  await assert.rejects(donorService.createDonor({
    name: 'Malformed Phone Donor', accountMode: 'EXISTING_PATIENT', patientAccountId: patient._id.toString(), phone: 'number123', bloodGroup: 'O+', availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor), { statusCode: 400 })
  await assert.rejects(donorService.createDonor({
    name: 'New Account Donor',
    accountMode: 'EXISTING_PATIENT',
    patientAccountId: new mongoose.Types.ObjectId().toString(),
    phone: '+8801000000002',
    bloodGroup: 'A+',
    availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor), { statusCode: 404 })
  await assert.rejects(donorService.createDonor({
    name: 'Duplicate donor',
    accountMode: 'STANDALONE',
    phone: patient.phone,
    bloodGroup: 'O+',
    availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor), { statusCode: 409 })

  const searched = await donorService.getDonors({ search: 'New Donor', page: '1', limit: '1' })
  assert.equal(searched.pagination.total, 1)
  assert.equal(searched.donors[0].id, patient._id.toString())
  assert.equal(Object.hasOwn(searched.donors[0], 'email'), false)
  assert.equal(Object.hasOwn(searched.donors[0], 'phone'), false)
  assert.equal(Object.hasOwn(searched.donors[0], 'notes'), false)
  assert.equal(Object.hasOwn(searched.donors[0], 'preferredContactMethod'), false)
  assert.equal((await donorService.getDonors({ bloodGroup: 'A+' })).pagination.total, 1)
  assert.equal((await donorService.getDonors({ division: 'Chattogram' })).pagination.total, 1)
  assert.equal((await donorService.getDonors({ district: 'Dhaka' })).pagination.total, 2)
  assert.equal((await donorService.getDonors({ upazila: 'Uttara' })).pagination.total, 1)
  assert.equal((await donorService.getDonors({ availability: 'AVAILABLE' })).pagination.total, 1)
  assert.equal((await donorService.getDonors({ availability: 'UNAVAILABLE' })).pagination.total, 2)
  assert.equal((await donorService.getDonors({ verificationStatus: 'PENDING' })).pagination.total, 1)
  assert.equal((await donorService.getDonors({ verificationStatus: 'VERIFIED' })).pagination.total, 1)
  await assert.rejects(donorService.getDonors({ verificationStatus: 'INVALID' }), { statusCode: 400 })
  await assert.rejects(donorService.getDonors({ bloodGroup: 'invalid' }), { statusCode: 400 })
  await assert.rejects(donorService.getDonors({ unknownFilter: 'value' }), { statusCode: 400 })

  const details = await donorService.getDonorById(patient._id.toString())
  assert.equal(details.email, patient.email)
  assert.equal(details.phone, patient.phone)
  assert.equal(Object.hasOwn(details, 'passwordHash'), false)
  assert.equal(Object.hasOwn(details, 'dateOfBirth'), false)
  await assert.rejects(donorService.verifyDonor(patient._id.toString(), {}, { permissions: [] }), { statusCode: 403 })
  const pendingAvailable = await donorService.updateDonorAvailability(patient._id.toString(), { availability: 'AVAILABLE' }, actor)
  assert.equal(pendingAvailable.availability, 'AVAILABLE')
  assert.equal(pendingAvailable.verificationStatus, 'PENDING')

  const updated = await donorService.updateDonor(patient._id.toString(), {
    name: 'Updated Donor',
    email: '',
    phone: patient.phone,
    bloodGroup: 'O+',
    availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
    lastDonationDate: '2025-02-01',
    preferredContactMethod: 'PHONE',
    phoneConsent: true,
    notes: 'Prefers evening calls',
  }, actor)
  assert.equal(updated.name, 'Updated Donor')
  assert.equal(updated.preferredContactMethod, 'PHONE')
  assert.equal(updated.phoneConsent, true)
  assert.equal(updated.notes, 'Prefers evening calls')
  assert.equal(updated.preferredContactMethod, 'PHONE')
  assert.equal(updated.notes, 'Prefers evening calls')
  await assert.rejects(donorService.updateDonor(patient._id.toString(), {
    name: 'Updated Donor', phone: patient.phone, bloodGroup: 'INVALID', availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor), { statusCode: 400 })

  const verified = await donorService.verifyDonor(patient._id.toString(), {}, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  const available = await donorService.updateDonorAvailability(patient._id.toString(), { availability: 'AVAILABLE' }, actor)
  assert.equal(available.availability, 'AVAILABLE')
  const suspended = await donorService.updateDonorStatus(patient._id.toString(), { status: 'SUSPEND' }, actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  assert.equal(suspended.availability, 'UNAVAILABLE')
  await assert.rejects(donorService.updateDonorAvailability(patient._id.toString(), { availability: 'AVAILABLE' }, actor), { statusCode: 409 })
  const restored = await donorService.updateDonorStatus(patient._id.toString(), { status: 'RESTORE' }, actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')
  assert.equal(restored.availability, 'UNAVAILABLE')

  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'DONOR_CREATED',
    'DONOR_AVAILABILITY_UPDATED',
    'DONOR_UPDATED',
    'DONOR_VERIFIED',
    'DONOR_AVAILABILITY_UPDATED',
    'DONOR_SUSPENDED',
    'DONOR_RESTORED',
  ])
})

test('existing patient selection links the account without changing its email and rejection requires an audited reason', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN', permissions: ['blood.moderate'] }
  const patient = createUser({ email: 'phone-only@example.com', phone: '+8801000000009' })
  users.push(patient)

  const donor = await donorService.createDonor({
    name: 'Phone Matched Donor', accountMode: 'EXISTING_PATIENT', patientAccountId: patient._id.toString(), phone: patient.phone, bloodGroup: 'AB-', availability: 'UNAVAILABLE',
    location: { division: 'Sylhet', district: 'Sylhet', upazila: 'Beanibazar' },
  }, actor)
  assert.equal(donor.email, patient.email)
  await assert.rejects(donorService.verifyDonor(donor.id, { status: 'REJECTED' }, actor), { statusCode: 400 })
  const rejected = await donorService.verifyDonor(donor.id, { status: 'REJECTED', reason: 'Contact details could not be confirmed' }, actor)
  assert.equal(rejected.verificationStatus, 'REJECTED')
  assert.equal(rejected.availability, 'UNAVAILABLE')
  assert.equal(auditEntries.at(-1).action, 'DONOR_REJECTED')
})

test('standalone donor creation stores a pending donor without exposing internal account credentials', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN', permissions: ['blood.moderate'] }
  const donor = await donorService.createDonor({
    name: 'Standalone Donor', accountMode: 'STANDALONE', phone: '+8801000000099', bloodGroup: 'B-', availability: 'AVAILABLE',
    location: { division: 'Rajshahi', district: 'Rajshahi', upazila: 'Boalia' },
  }, actor)
  const storedDonor = users.find((user) => user._id.toString() === donor.id)

  assert.equal(donor.verificationStatus, 'PENDING')
  assert.equal(donor.availability, 'AVAILABLE')
  assert.equal(donor.email, undefined)
  assert.equal(storedDonor.role, 'BLOOD_DONOR')
  assert.equal(storedDonor.donorStandalone, true)
  assert.equal(auditEntries.at(-1).details.accountMode, 'STANDALONE')
  assert.match(storedDonor.email, /^donor-[a-f0-9]+@standalone\.invalid$/)
  assert.ok(storedDonor.passwordHash)
  assert.equal(Object.hasOwn(await donorService.getDonorById(donor.id), 'email'), false)
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'B-' })).pagination.total, 0)
  const adminUser = (await adminUserService.getUsers({ search: 'Standalone Donor' })).users[0]
  assert.equal(adminUser.email, null)
  await assert.rejects(authService.login({ email: storedDonor.email, password: 'any-password' }), { statusCode: 401 })
  await assert.rejects(donorService.createDonor({
    name: 'Duplicate Standalone Donor', accountMode: 'STANDALONE', phone: '+8801000000099', bloodGroup: 'B-', availability: 'UNAVAILABLE',
    location: { division: 'Rajshahi', district: 'Rajshahi', upazila: 'Boalia' },
  }, actor), { statusCode: 409 })
})

test('donor profile fields validate on the existing User persistence model without credentials in donor input', () => {
  const user = new User({
    name: 'Schema Donor',
    email: 'schema-donor@example.com',
    phone: '+8801000000010',
    passwordHash: 'existing-account-hash',
    role: 'BLOOD_DONOR',
    bloodGroup: 'AB+',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
    donorAvailability: 'UNAVAILABLE',
    donorVerificationStatus: 'REJECTED',
    donorVerificationReason: 'Could not confirm contact details',
    donorLastDonationDate: new Date('2025-01-15T00:00:00.000Z'),
    donorPreferredContactMethod: 'SMS',
    donorPhoneConsent: true,
    donorNotes: 'Contact after 5 PM',
  })

  assert.equal(user.validateSync(), undefined)
  assert.equal(user.donorVerificationStatus, 'REJECTED')
  assert.equal(user.donorPreferredContactMethod, 'SMS')
  assert.equal(user.donorPhoneConsent, true)

  const standalone = new User({
    name: 'Standalone Schema Donor',
    email: 'donor-0123456789abcdef01234567@standalone.invalid',
    phone: '+8801000000014',
    passwordHash: 'internal-random-password-hash',
    role: 'BLOOD_DONOR',
    donorStandalone: true,
    bloodGroup: 'O-',
    donorAvailability: 'UNAVAILABLE',
    donorVerificationStatus: 'PENDING',
  })
  assert.equal(standalone.validateSync(), undefined)
})

test('public donor publication requires active verified status and applies availability independently', async () => {
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'ADMIN', permissions: ['blood.moderate'] }
  const patient = createUser({ email: 'publication@example.com', phone: '+8801000000011' })
  users.push(patient)

  const pending = await donorService.createDonor({
    name: 'Publication Test Donor', accountMode: 'EXISTING_PATIENT', patientAccountId: patient._id.toString(), phone: patient.phone, phoneConsent: true, bloodGroup: 'AB+', availability: 'UNAVAILABLE',
    location: { division: 'Dhaka', district: 'Dhaka', upazila: 'Uttara' },
  }, actor)
  await assert.rejects(publicDonorService.getPublicDonors({ availability: 'SOMETIMES' }), { statusCode: 400 })
  await assert.rejects(publicDonorService.getPublicDonors({ search: 'x'.repeat(101) }), { statusCode: 400 })
  await assert.rejects(publicDonorService.getPublicDonors({ availability: 'UNAVAILABLE', availableOnly: true }), { statusCode: 400 })
  assert.equal(pending.verificationStatus, 'PENDING')
  const hidden = await invokePublicDonorController({ bloodGroup: 'AB+' })
  assert.equal(hidden.statusCode, 200)
  assert.equal(hidden.body.data.pagination.total, 0)

  const verified = await donorService.verifyDonor(pending.id, {}, actor)
  assert.equal(verified.verificationStatus, 'VERIFIED')
  const publishedResponse = await invokePublicDonorController({ bloodGroup: 'AB+' })
  const published = publishedResponse.body.data
  assert.equal(publishedResponse.statusCode, 200)
  assert.equal(published.pagination.total, 1)
  assert.equal(published.donors[0].id, pending.id)
  assert.equal(published.donors[0].availability, 'UNAVAILABLE')
  assert.equal(published.donors[0].name, 'Publication Test Donor')
  assert.equal(published.donors[0].verificationStatus, 'VERIFIED')
  assert.equal(published.donors[0].phoneConsent, true)
  assert.equal(published.donors[0].phone, patient.phone)
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB+', availableOnly: 'true' })).pagination.total, 0)

  await donorService.updateDonorAvailability(pending.id, { availability: 'AVAILABLE' }, actor)
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB+', availableOnly: 'true' })).pagination.total, 1)

  const suspended = await donorService.updateDonorStatus(pending.id, { status: 'SUSPEND' }, actor)
  assert.equal(suspended.verificationStatus, 'SUSPENDED')
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB+' })).pagination.total, 0)

  const restored = await donorService.updateDonorStatus(pending.id, { status: 'RESTORE' }, actor)
  assert.equal(restored.verificationStatus, 'VERIFIED')
  assert.equal(restored.availability, 'UNAVAILABLE')
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB+' })).pagination.total, 1)
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB+', availableOnly: 'true' })).pagination.total, 0)
  assert.deepEqual(auditEntries.slice(-4).map((entry) => entry.action), [
    'DONOR_VERIFIED', 'DONOR_AVAILABILITY_UPDATED', 'DONOR_SUSPENDED', 'DONOR_RESTORED',
  ])

  const rejectedPatient = createUser({ email: 'rejected-publication@example.com', phone: '+8801000000012' })
  users.push(rejectedPatient)
  const rejectedDonor = await donorService.createDonor({
    name: 'Rejected Publication Donor', accountMode: 'EXISTING_PATIENT', patientAccountId: rejectedPatient._id.toString(), phone: rejectedPatient.phone, bloodGroup: 'AB-', availability: 'UNAVAILABLE',
    location: { division: 'Khulna', district: 'Khulna', upazila: 'Sonadanga' },
  }, actor)
  await donorService.verifyDonor(rejectedDonor.id, { status: 'REJECTED', reason: 'Unable to verify donor details' }, actor)
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'AB-' })).pagination.total, 0)

  users.push(createUser({
    name: 'Inactive verified donor', email: 'inactive-publication@example.com', phone: '+8801000000013',
    role: 'BLOOD_DONOR', accountStatus: 'SUSPENDED', bloodGroup: 'B-', donorAvailability: 'AVAILABLE', donorVerificationStatus: 'VERIFIED',
  }))
  assert.equal((await publicDonorService.getPublicDonors({ bloodGroup: 'B-' })).pagination.total, 0)
})
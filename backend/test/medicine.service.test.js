const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const MedicineAvailability = require('../src/models/MedicineAvailability')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const medicineService = require('../src/services/medicine.service')

const providers = []
const medicines = []
const auditEntries = []
const originalMethods = {
  providerFind: Provider.find,
  providerFindOne: Provider.findOne,
  medicineFind: MedicineAvailability.find,
  medicineFindOne: MedicineAvailability.findOne,
  medicineCreate: MedicineAvailability.create,
  medicineCount: MedicineAvailability.countDocuments,
  medicineDelete: MedicineAvailability.deleteOne,
  auditCreate: AdminAuditLog.create,
}

function matches(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$and') return expected.every((condition) => matches(record, condition))
    if (key === '$or') return expected.some((condition) => matches(record, condition))
    const value = record[key]
    if (expected?.$regex) return new RegExp(expected.$regex, expected.$options).test(value || '')
    if (expected?.$in) return expected.$in.some((item) => item.toString() === value?.toString())
    return value?.toString() === expected?.toString()
  })
}

function createMedicine(data) {
  return {
    _id: new mongoose.Types.ObjectId(),
    availability: 'AVAILABLE',
    genericName: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
    set(field, value) { this[field] = value },
    async save() { this.updatedAt = new Date(); return this },
  }
}

function findQuery(items) {
  let result = items
  return {
    sort() { return this },
    skip(count) { result = result.slice(count); return this },
    limit(count) { result = result.slice(0, count); return this },
    lean() { return Promise.resolve(result.map((item) => ({ ...item }))) },
  }
}

Provider.find = (filter) => findQuery(providers.filter((provider) => matches(provider, filter)))
Provider.findOne = (filter) => {
  const provider = providers.find((entry) => matches(entry, filter)) || null
  return { lean: () => Promise.resolve(provider ? { ...provider } : null) }
}
MedicineAvailability.find = (filter) => findQuery(medicines.filter((medicine) => matches(medicine, filter)))
MedicineAvailability.findOne = (filter) => {
  const medicine = medicines.find((entry) => matches(entry, filter)) || null
  return {
    then(resolve, reject) { return Promise.resolve(medicine).then(resolve, reject) },
  }
}
MedicineAvailability.create = async (data) => {
  const medicine = createMedicine(data)
  medicines.push(medicine)
  return medicine
}
MedicineAvailability.countDocuments = async (filter) => medicines.filter((medicine) => matches(medicine, filter)).length
MedicineAvailability.deleteOne = async (filter) => {
  const index = medicines.findIndex((medicine) => matches(medicine, filter))
  if (index >= 0) medicines.splice(index, 1)
  return { deletedCount: index >= 0 ? 1 : 0 }
}
AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }

after(() => {
  Provider.find = originalMethods.providerFind
  Provider.findOne = originalMethods.providerFindOne
  MedicineAvailability.find = originalMethods.medicineFind
  MedicineAvailability.findOne = originalMethods.medicineFindOne
  MedicineAvailability.create = originalMethods.medicineCreate
  MedicineAvailability.countDocuments = originalMethods.medicineCount
  MedicineAvailability.deleteOne = originalMethods.medicineDelete
  AdminAuditLog.create = originalMethods.auditCreate
})

test('pharmacy medicine management validates inputs and records inventory audit events', async () => {
  const pharmacy = {
    _id: new mongoose.Types.ObjectId(),
    providerType: 'Pharmacy',
    verificationStatus: 'VERIFIED',
    name: 'Central Pharmacy',
    contactPhone: '+8801000000000',
    district: 'Dhaka',
  }
  providers.push(pharmacy)
  const actor = { userId: new mongoose.Types.ObjectId(), role: 'ADMIN' }

  const created = await medicineService.createPharmacyMedicine(pharmacy._id.toString(), {
    name: 'Example Tablet',
    genericName: 'Example',
    strength: '500 mg',
    dosageForm: 'Tablet',
  }, actor)
  assert.equal(created.availability, 'AVAILABLE')
  assert.equal(created.pharmacyId, pharmacy._id.toString())
  assert.equal((await medicineService.listPharmacyInventory(pharmacy._id.toString())).length, 1)
  await assert.rejects(
    medicineService.createPharmacyMedicine(pharmacy._id.toString(), { name: 'Unsafe', strength: '10 mg', dosageForm: 'Tablet', extra: 'field' }, actor),
    { statusCode: 400 },
  )

  const updated = await medicineService.updatePharmacyMedicine(pharmacy._id.toString(), created.id, {
    availability: 'UNAVAILABLE',
  }, actor)
  assert.equal(updated.availability, 'UNAVAILABLE')
  assert.equal((await medicineService.deletePharmacyMedicine(pharmacy._id.toString(), created.id, actor)).id, created.id)
  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'pharmacy.inventory.added',
    'pharmacy.inventory.updated',
    'pharmacy.inventory.removed',
  ])
})

test('public medicine search includes only verified pharmacy inventory and escapes search input', async () => {
  const verified = providers.find((provider) => provider.verificationStatus === 'VERIFIED')
  const pendingPharmacy = {
    _id: new mongoose.Types.ObjectId(),
    providerType: 'Pharmacy',
    verificationStatus: 'PENDING',
    name: 'Pending Pharmacy',
  }
  providers.push(pendingPharmacy)
  medicines.push(
    createMedicine({ pharmacyId: verified._id, name: 'Example Tablet', strength: '500 mg', dosageForm: 'Tablet' }),
    createMedicine({ pharmacyId: pendingPharmacy._id, name: 'Example Tablet', strength: '500 mg', dosageForm: 'Tablet' }),
  )

  const result = await medicineService.searchMedicineAvailability({ search: 'Example', location: 'Dhaka' })
  assert.equal(result.pagination.total, 1)
  assert.equal(result.medicines[0].pharmacy.name, 'Central Pharmacy')
  assert.equal(result.medicines[0].pharmacy.contactPhone, '+8801000000000')
  await assert.rejects(medicineService.searchMedicineAvailability({ unexpected: 'field' }), { statusCode: 400 })
  await assert.rejects(medicineService.searchMedicineAvailability({ search: 'x'.repeat(121) }), { statusCode: 400 })
})

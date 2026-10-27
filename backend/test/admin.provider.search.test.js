const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Provider = require('../src/models/Provider')
const providerService = require('../src/services/admin.provider.service')

const providers = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Dr. Ada Rahman',
    providerType: 'Doctor',
    contactEmail: 'ada@example.com',
    verificationStatus: 'PENDING',
    submittedDocuments: [{ documentType: 'License', fileName: 'license.pdf', storageId: 'private-id' }],
    createdAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Central Hospital',
    providerType: 'Hospital',
    contactEmail: 'hospital@example.com',
    verificationStatus: 'VERIFIED',
    submittedDocuments: [],
    createdAt: new Date(),
  },
]
const originalFind = Provider.find
const originalCountDocuments = Provider.countDocuments

function matches(provider, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((condition) => matches(provider, condition))
    if (expected && expected.$regex) return new RegExp(expected.$regex, expected.$options).test(provider[key] || '')
    return provider[key]?.toString() === expected?.toString()
  })
}

Provider.find = (filter) => {
  let result = providers.filter((provider) => matches(provider, filter))
  return {
    sort() { return this },
    skip(count) { result = result.slice(count); return this },
    limit(count) { result = result.slice(0, count); return this },
    lean() { return Promise.resolve(result) },
  }
}
Provider.countDocuments = async (filter) => providers.filter((provider) => matches(provider, filter)).length

after(() => {
  Provider.find = originalFind
  Provider.countDocuments = originalCountDocuments
})

test('verification center provider search is escaped, type-scoped, and omits private storage IDs', async () => {
  const result = await providerService.getProviders({ providerType: 'Doctor', search: 'Ada', page: '1', limit: '20' })
  assert.equal(result.pagination.total, 1)
  assert.equal(result.providers[0].name, 'Dr. Ada Rahman')
  assert.equal(Object.hasOwn(result.providers[0].submittedDocuments[0], 'storageId'), false)
  assert.equal((await providerService.getProviders({ providerType: 'Doctor', search: 'Central Hospital' })).pagination.total, 0)
  await assert.rejects(providerService.getProviders({ search: 3 }), { statusCode: 400 })
})
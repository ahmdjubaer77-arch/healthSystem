const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const HealthProfile = require('../src/models/HealthProfile')
const HealthTimeline = require('../src/models/MedicalTimeline')
const HealthDocument = require('../src/models/MedicalDocument')
const HealthShare = require('../src/models/HealthShare')
const HealthAccessEvent = require('../src/models/HealthAccessEvent')
const User = require('../src/models/User')
const healthService = require('../src/services/health.service')
const sharingService = require('../src/services/health-sharing.service')

const originalMethods = {
  shareCreate: HealthShare.create,
  shareFindOne: HealthShare.findOne,
  shareFindById: HealthShare.findById,
  shareFindOneAndUpdate: HealthShare.findOneAndUpdate,
  shareFind: HealthShare.find,
  shareUpdateMany: HealthShare.updateMany,
  shareDeleteOne: HealthShare.deleteOne,
  eventCreate: HealthAccessEvent.create,
  eventInsertMany: HealthAccessEvent.insertMany,
  eventFind: HealthAccessEvent.find,
  eventCount: HealthAccessEvent.countDocuments,
  timelineFind: HealthTimeline.find,
  timelineCount: HealthTimeline.countDocuments,
  documentFind: HealthDocument.find,
  documentFindOne: HealthDocument.findOne,
  documentCount: HealthDocument.countDocuments,
  profileFindOne: HealthProfile.findOne,
  userFindOne: User.findOne,
  userFind: User.find,
  privateContent: healthService.getMedicalDocumentContent,
}

after(() => {
  HealthShare.create = originalMethods.shareCreate
  HealthShare.findOne = originalMethods.shareFindOne
  HealthShare.findById = originalMethods.shareFindById
  HealthShare.findOneAndUpdate = originalMethods.shareFindOneAndUpdate
  HealthShare.find = originalMethods.shareFind
  HealthShare.updateMany = originalMethods.shareUpdateMany
  HealthShare.deleteOne = originalMethods.shareDeleteOne
  HealthAccessEvent.create = originalMethods.eventCreate
  HealthAccessEvent.insertMany = originalMethods.eventInsertMany
  HealthAccessEvent.find = originalMethods.eventFind
  HealthAccessEvent.countDocuments = originalMethods.eventCount
  HealthTimeline.find = originalMethods.timelineFind
  HealthTimeline.countDocuments = originalMethods.timelineCount
  HealthDocument.find = originalMethods.documentFind
  HealthDocument.findOne = originalMethods.documentFindOne
  HealthDocument.countDocuments = originalMethods.documentCount
  HealthProfile.findOne = originalMethods.profileFindOne
  User.findOne = originalMethods.userFindOne
  User.find = originalMethods.userFind
  healthService.getMedicalDocumentContent = originalMethods.privateContent
})

const ownerId = '65a000000000000000000001'
const recipientId = '65a000000000000000000002'
const otherUserId = '65a000000000000000000003'
const shareId = '65a000000000000000000004'
const recordId = '65a000000000000000000005'
const documentId = '65a000000000000000000006'
const recipientPublicUserId = 'BDH-7K9P2X4M'

function recipientStub() {
  User.findOne = () => ({
    select: async () => ({
      _id: new mongoose.Types.ObjectId(recipientId),
      publicUserId: recipientPublicUserId,
      name: 'Recipient Example',
      accountStatus: 'ACTIVE',
    }),
  })
}

function activeShare(scopes) {
  return {
    _id: new mongoose.Types.ObjectId(shareId),
    ownerUserId: new mongoose.Types.ObjectId(ownerId),
    recipientUserId: new mongoose.Types.ObjectId(recipientId),
    scopes,
    status: 'ACTIVE',
    expiresAt: null,
  }
}

test('requires explicit consent and rejects invalid or unowned scope records', async () => {
  const createdEvents = []
  HealthShare.create = async () => { throw new Error('share must not be created') }
  HealthAccessEvent.create = async (event) => createdEvents.push(event)
  await assert.rejects(
    sharingService.createShare(ownerId, {
      recipientPublicUserId,
      scopes: [{ resourceType: 'PROFILE', category: 'PROFILE', resourceIds: [] }],
      consentConfirmed: false,
    }),
    (error) => error.statusCode === 400,
  )

  recipientStub()
  HealthTimeline.find = () => ({
    select: async () => [],
  })
  await assert.rejects(
    sharingService.createShare(ownerId, {
      recipientPublicUserId,
      scopes: [{ resourceType: 'TIMELINE', category: 'REPORT', resourceIds: [recordId] }],
      consentConfirmed: true,
    }),
    (error) => error.statusCode === 400,
  )
  assert.equal(createdEvents.length, 0)
})

test('creates consent by resolving the recipient public ID to its internal account ID', async () => {
  recipientStub()
  let inserted
  const grantId = new mongoose.Types.ObjectId(shareId)
  HealthShare.create = async (values) => {
    inserted = values
    return { ...values, _id: grantId }
  }
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)

  const result = await sharingService.createShare(ownerId, {
    recipientPublicUserId,
    scopes: [{ resourceType: 'PROFILE', category: 'PROFILE', resourceIds: [] }],
    expiresAt: '2099-12-31',
    consentConfirmed: true,
  })

  assert.equal(result._id, grantId)
  assert.equal(inserted.ownerUserId, ownerId)
  assert.equal(inserted.recipientUserId, recipientId)
  assert.equal(inserted.readOnly, true)
  assert.equal(inserted.expiresAt.toISOString(), '2099-12-31T23:59:59.999Z')
  assert.equal(events.length, 1)
  assert.equal(events[0].action, 'SHARE_GRANTED')
  assert.equal(events[0].result, 'SUCCESS')
})

test('recipient lookup returns only display name and masked public ID', async () => {
  recipientStub()
  let queried
  User.findOne = (filter) => {
    queried = filter
    return {
      select: async () => ({
        _id: new mongoose.Types.ObjectId(recipientId),
        publicUserId: recipientPublicUserId,
        name: 'Recipient Example',
      }),
    }
  }
  const result = await sharingService.lookupRecipient(ownerId, recipientPublicUserId.toLowerCase())
  assert.deepEqual(queried, {
    publicUserId: recipientPublicUserId,
    accountStatus: { $in: ['ACTIVE', null] },
  })
  assert.deepEqual(result, { name: 'Recipient Example', maskedUserId: 'BDH-****2X4M' })
  await assert.rejects(
    sharingService.lookupRecipient(ownerId, '65a000000000000000000002'),
    (error) => error.statusCode === 400,
  )
})

test('recipient lookup accepts legacy accounts with no stored status and still masks their ID', async () => {
  let queried
  User.findOne = (filter) => {
    queried = filter
    return {
      select: async () => ({
        _id: new mongoose.Types.ObjectId(recipientId),
        publicUserId: recipientPublicUserId,
        name: 'Legacy Recipient',
      }),
    }
  }

  const result = await sharingService.lookupRecipient(ownerId, recipientPublicUserId)
  assert.deepEqual(queried.accountStatus, { $in: ['ACTIVE', null] })
  assert.deepEqual(result, {
    name: 'Legacy Recipient',
    maskedUserId: 'BDH-****2X4M',
  })
})

test('lists only active, unexpired shares addressed to the authenticated recipient', async () => {
  const active = activeShare([
    { resourceType: 'TIMELINE', category: 'REPORT', resourceIds: [new mongoose.Types.ObjectId(recordId)] },
    { resourceType: 'DOCUMENT', category: 'MEDICAL_REPORT', resourceIds: [] },
  ])
  active.createdAt = new Date('2026-02-01T00:00:00.000Z')
  active.expiresAt = new Date(Date.now() + 60_000)
  let filter
  HealthShare.find = (actualFilter) => {
    filter = actualFilter
    return {
      sort() { return this },
      limit() { return this },
      lean: async () => [active],
    }
  }
  User.find = (actualFilter) => {
    assert.deepEqual(actualFilter._id.$in, [active.ownerUserId.toString()])
    return {
      select: () => ({
        lean: async () => [{
          _id: active.ownerUserId,
          name: 'Owner Example',
          publicUserId: 'BDH-7K9P2X4M',
          email: 'must-not-be-returned@example.invalid',
        }],
      }),
    }
  }

  const received = await sharingService.listReceivedShares(recipientId)
  assert.equal(filter.recipientUserId, recipientId)
  assert.equal(filter.status, 'ACTIVE')
  assert.equal(filter.$or[0].expiresAt, null)
  assert.ok(filter.$or[1].expiresAt.$gt instanceof Date)
  assert.deepEqual(received, [{
    id: shareId,
    owner: { name: 'Owner Example', maskedUserId: 'BDH-****2X4M' },
    scopes: [
      { resourceType: 'TIMELINE', category: 'REPORT', recordCount: 1 },
      { resourceType: 'DOCUMENT', category: 'MEDICAL_REPORT', recordCount: 0 },
    ],
    createdAt: active.createdAt,
    expiresAt: active.expiresAt,
  }])
})

test('owner grant is visible to recipient, permits scoped read, and stops immediately on revocation', async () => {
  const recipient = {
    _id: new mongoose.Types.ObjectId(recipientId),
    publicUserId: recipientPublicUserId,
    name: 'Recipient Example',
    accountStatus: 'ACTIVE',
  }
  const owner = {
    _id: new mongoose.Types.ObjectId(ownerId),
    publicUserId: 'BDH-23456789',
    name: 'Owner Example',
  }
  let storedShare
  const events = []

  User.findOne = () => ({ select: async () => recipient })
  User.find = () => ({
    select: () => ({
      lean: async () => [owner],
    }),
  })
  HealthShare.create = async (input) => {
    storedShare = {
      ...input,
      _id: new mongoose.Types.ObjectId(shareId),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      status: 'ACTIVE',
      expiresAt: null,
    }
    return storedShare
  }
  HealthShare.find = () => ({
    sort() { return this },
    limit() { return this },
    lean: async () => [storedShare],
  })
  HealthShare.findOne = async () => storedShare
  HealthShare.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter.ownerUserId, ownerId)
    storedShare.status = update.$set.status
    storedShare.revokedAt = update.$set.revokedAt
    return storedShare
  }
  HealthProfile.findOne = () => ({
    lean: async () => ({
      _id: new mongoose.Types.ObjectId(recordId),
      user: new mongoose.Types.ObjectId(ownerId),
      bloodGroup: 'A+',
    }),
  })
  HealthAccessEvent.create = async (event) => events.push(event)

  await sharingService.createShare(ownerId, {
    recipientPublicUserId,
    scopes: [{ resourceType: 'PROFILE', category: 'PROFILE', resourceIds: [] }],
    consentConfirmed: true,
  })
  assert.equal(storedShare.recipientUserId, recipient._id.toString())

  const [received] = await sharingService.listReceivedShares(recipientId)
  assert.equal(received.id, shareId)
  assert.equal(received.owner.name, owner.name)

  const profile = await sharingService.getSharedProfile(recipientId, shareId)
  assert.equal(profile.bloodGroup, 'A+')
  assert.equal(events.at(-1).result, 'SUCCESS')

  await sharingService.revokeShare(ownerId, shareId)
  await assert.rejects(
    sharingService.getSharedProfile(recipientId, shareId),
    (error) => error.statusCode === 404,
  )
  assert.equal(events.at(-1).result, 'DENIED')
})

test('returns only scoped timeline records and appends a successful view event', async () => {
  recipientStub()
  const share = activeShare([{ resourceType: 'TIMELINE', category: 'REPORT', resourceIds: [] }])
  HealthShare.findOne = async () => share
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)
  let query
  const timeline = {
    _id: new mongoose.Types.ObjectId(recordId),
    user: new mongoose.Types.ObjectId(ownerId),
    type: 'OTHER',
    recordType: 'REPORT',
    title: 'Patient report',
    description: 'Authorized report details',
    details: { name: 'Lab report' },
    date: new Date('2026-01-02T00:00:00.000Z'),
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
  }
  HealthTimeline.find = (filter) => {
    query = filter
    return {
      sort() { return this },
      skip() { return this },
      limit() { return this },
      lean: async () => [timeline],
    }
  }
  HealthTimeline.countDocuments = async () => 1

  const result = await sharingService.listSharedTimeline(recipientId, shareId, { page: '1', limit: '10' })

  assert.deepEqual(query.user, share.ownerUserId)
  assert.ok(query.$or.some((scope) => scope.recordType === 'REPORT'))
  assert.equal(result.records.length, 1)
  assert.equal(result.records[0].title, 'Patient report')
  assert.equal('user' in result.records[0], false)
  assert.equal(events.length, 1)
  assert.equal(events[0].action, 'VIEW')
  assert.equal(events[0].resourceId.toString(), recordId)
  assert.equal(events[0].result, 'SUCCESS')
})

test('allows authorized private document downloads and logs only after retrieval succeeds', async () => {
  recipientStub()
  const share = activeShare([{
    resourceType: 'DOCUMENT',
    category: 'MEDICAL_REPORT',
    resourceIds: [new mongoose.Types.ObjectId(documentId)],
  }])
  HealthShare.findOne = async () => share
  HealthDocument.findOne = () => ({
    select: async () => ({ type: 'MEDICAL_REPORT' }),
  })
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)
  healthService.getMedicalDocumentContent = async (actualOwnerId, actualDocumentId) => {
    assert.equal(actualOwnerId, ownerId)
    assert.equal(actualDocumentId, documentId)
    return { buffer: Buffer.from('private bytes'), fileName: 'report.png', contentType: 'image/png' }
  }

  const result = await sharingService.getSharedDocumentContent(recipientId, shareId, documentId)
  assert.equal(result.buffer.toString(), 'private bytes')
  assert.equal(events.length, 1)
  assert.equal(events[0].action, 'DOWNLOAD')
  assert.equal(events[0].result, 'SUCCESS')
})

test('denies cross-user, expired, revoked, and out-of-scope requests without exposing records', async () => {
  recipientStub()
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)
  const inaccessible = activeShare([])
  HealthShare.findOne = async () => null
  HealthShare.findById = async () => inaccessible
  await assert.rejects(
    sharingService.getSharedProfile(otherUserId, shareId),
    (error) => error.statusCode === 404,
  )
  assert.equal(events[events.length - 1].action, 'ACCESS_DENIED')
  assert.equal(events[events.length - 1].result, 'DENIED')

  HealthShare.findOne = async () => ({ ...activeShare([]), status: 'REVOKED' })
  await assert.rejects(
    sharingService.getSharedProfile(recipientId, shareId),
    (error) => error.statusCode === 404,
  )
  assert.equal(events[events.length - 1].result, 'DENIED')

  HealthShare.findOne = async () => ({ ...activeShare([]), expiresAt: new Date(Date.now() - 1000) })
  await assert.rejects(
    sharingService.getSharedProfile(recipientId, shareId),
    (error) => error.statusCode === 404,
  )

  HealthShare.findOne = async () => activeShare([])
  await assert.rejects(
    sharingService.getSharedProfile(recipientId, shareId),
    (error) => error.statusCode === 404,
  )
  assert.equal(events.length, 4)
})

test('denies a document ID outside the explicit scope and records the denial', async () => {
  recipientStub()
  const share = activeShare([{
    resourceType: 'DOCUMENT',
    category: 'MEDICAL_REPORT',
    resourceIds: [new mongoose.Types.ObjectId(otherUserId)],
  }])
  HealthShare.findOne = async () => share
  HealthDocument.findOne = () => ({
    select: async () => ({ type: 'MEDICAL_REPORT' }),
  })
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)
  healthService.getMedicalDocumentContent = async () => {
    throw new Error('Unscoped files must never be retrieved')
  }

  await assert.rejects(
    sharingService.getSharedDocumentContent(recipientId, shareId, documentId),
    (error) => error.statusCode === 404,
  )
  assert.equal(events.length, 1)
  assert.equal(events[0].action, 'ACCESS_DENIED')
  assert.equal(events[0].resourceId.toString(), documentId)
  assert.equal(events[0].result, 'DENIED')
})

test('revocation is owner-scoped and records a separate immutable audit event', async () => {
  const events = []
  HealthAccessEvent.create = async (event) => events.push(event)
  let filter
  HealthShare.findOneAndUpdate = async (actualFilter, update) => {
    filter = actualFilter
    return {
      _id: new mongoose.Types.ObjectId(shareId),
      revokedAt: update.$set.revokedAt,
    }
  }
  const result = await sharingService.revokeShare(ownerId, shareId)
  assert.equal(filter.ownerUserId, ownerId)
  assert.equal(filter.status, 'ACTIVE')
  assert.equal(result.status, 'REVOKED')
  assert.equal(events[0].action, 'SHARE_REVOKED')
  assert.equal(events[0].actorUserId, ownerId)
})

test('account deletion revokes active inbound and outbound grants and appends revocation events', async () => {
  const shares = [{
    _id: new mongoose.Types.ObjectId(shareId),
    ownerUserId: new mongoose.Types.ObjectId(ownerId),
  }]
  let update
  let events
  HealthShare.find = async (filter) => {
    assert.deepEqual(filter, {
      $or: [{ ownerUserId: ownerId }, { recipientUserId: ownerId }],
      status: 'ACTIVE',
    })
    return shares
  }
  HealthShare.updateMany = async (filter, change) => { update = { filter, change } }
  HealthAccessEvent.insertMany = async (records) => { events = records }

  await sharingService.revokeSharesForAccountDeletion(ownerId)

  assert.equal(update.filter.status, 'ACTIVE')
  assert.deepEqual(update.change.$set.status, 'REVOKED')
  assert.equal(events.length, 1)
  assert.equal(events[0].action, 'SHARE_REVOKED')
  assert.equal(events[0].actorUserId, ownerId)
})

test('blocks update and delete operations on access history records', async () => {
  await assert.rejects(
    HealthAccessEvent.updateOne({}, { $set: { action: 'DOWNLOAD' } }).exec(),
    /append-only/,
  )
  await assert.rejects(
    HealthAccessEvent.deleteMany({}).exec(),
    /append-only/,
  )
  const event = new HealthAccessEvent({
    shareId,
    ownerUserId: ownerId,
    actorUserId: recipientId,
    action: 'VIEW',
    resourceType: 'PROFILE',
    result: 'SUCCESS',
  })
  await assert.rejects(event.deleteOne(), /append-only/)
})

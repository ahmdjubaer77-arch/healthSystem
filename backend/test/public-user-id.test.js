const { test } = require('node:test')
const assert = require('node:assert/strict')
const { generatePublicUserId, createUserWithPublicId, backfillMissingPublicUserIds, PUBLIC_USER_ID_PATTERN } = require('../src/utils/public-user-id')
const User = require('../src/models/User')

test('generates distinct cryptographically random IDs matching the public format', () => {
  const generated = new Set(Array.from({ length: 1000 }, generatePublicUserId))
  assert.equal(generated.size, 1000)
  for (const publicUserId of generated) {
    assert.match(publicUserId, PUBLIC_USER_ID_PATTERN)
  }
})

test('retries a public ID unique-index collision with a fresh ID', async () => {
  const attemptedIds = []
  const fakeUserModel = {
    async create(input) {
      attemptedIds.push(input.publicUserId)
      if (attemptedIds.length === 1) {
        const collision = new Error('Duplicate public ID')
        collision.code = 11000
        collision.keyPattern = { publicUserId: 1 }
        throw collision
      }
      return input
    },
  }

  const created = await createUserWithPublicId({ name: 'Test User' }, fakeUserModel)
  assert.equal(attemptedIds.length, 2)
  assert.notEqual(attemptedIds[0], attemptedIds[1])
  assert.equal(created.publicUserId, attemptedIds[1])
})

test('does not retry unrelated duplicate-key errors', async () => {
  let attempts = 0
  const duplicateEmail = new Error('Duplicate email')
  duplicateEmail.code = 11000
  duplicateEmail.keyPattern = { email: 1 }

  await assert.rejects(
    createUserWithPublicId({ name: 'Test User' }, {
      async create() {
        attempts += 1
        throw duplicateEmail
      },
    }),
    (error) => error === duplicateEmail,
  )
  assert.equal(attempts, 1)
})

test('backfills legacy accounts that do not yet have a public ID', async () => {
  const updated = []
  const fakeUserModel = {
    find(filter) {
      assert.deepEqual(filter.$or, [
        { publicUserId: { $exists: false } },
        { publicUserId: null },
        { publicUserId: '' },
      ])
      return {
        select: async () => [{ _id: 'legacy-user-1' }, { _id: 'legacy-user-2' }],
      }
    },
    collection: {
      async updateOne(filter, update) {
        updated.push({ filter, update })
        return { matchedCount: 1, modifiedCount: 1 }
      },
    },
  }

  await backfillMissingPublicUserIds(fakeUserModel)
  assert.equal(updated.length, 2)
  for (const item of updated) {
    assert.match(item.update.$set.publicUserId, PUBLIC_USER_ID_PATTERN)
    assert.equal(item.filter._id.startsWith('legacy-user-'), true)
  }
})

test('User schema enforces immutable, unique public IDs and generates one during validation', async () => {
  const publicIdPath = User.schema.path('publicUserId')
  assert.equal(publicIdPath.options.immutable, true)
  assert.equal(publicIdPath.options.unique, true)
  assert.equal(publicIdPath.options.sparse, true)

  const user = new User({
    name: 'Generated ID User',
    email: 'generated-id@example.test',
    passwordHash: 'hashed',
  })
  await user.validate()
  assert.match(user.publicUserId, PUBLIC_USER_ID_PATTERN)
})

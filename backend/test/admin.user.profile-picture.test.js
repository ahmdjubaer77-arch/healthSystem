const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const User = require('../src/models/User')
const adminUserService = require('../src/services/admin.user.service')

const originalFind = User.find
const originalCountDocuments = User.countDocuments

after(() => {
  User.find = originalFind
  User.countDocuments = originalCountDocuments
})

test('admin user list returns profile picture URL without storage identifiers', async () => {
  const picture = {
    url: 'https://images.example.test/profile.jpg',
    publicId: 'private-storage-id',
  }
  const account = {
    _id: { toString: () => '65a000000000000000000010' },
    name: 'Test User',
    email: 'test@example.test',
    profilePicture: picture,
  }
  const query = {
    sort() { return this },
    skip() { return this },
    limit() { return this },
    lean: async () => [account],
  }

  User.find = () => query
  User.countDocuments = async () => 1

  const result = await adminUserService.getUsers({})

  assert.deepEqual(result.users[0].profilePicture, { url: picture.url })
  assert.equal(Object.hasOwn(result.users[0].profilePicture, 'publicId'), false)
})

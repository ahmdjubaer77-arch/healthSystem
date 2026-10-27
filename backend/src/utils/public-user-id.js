const crypto = require('crypto')

const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const PUBLIC_USER_ID_PATTERN = /^BDH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/
const MAX_GENERATION_ATTEMPTS = 5

function generatePublicUserId() {
  const bytes = crypto.randomBytes(8)
  let suffix = ''
  for (const byte of bytes) {
    suffix += ID_ALPHABET[byte & 31]
  }
  return `BDH-${suffix}`
}

function isPublicUserIdCollision(error) {
  return error?.code === 11000
    && (error.keyPattern?.publicUserId === 1 || error.keyValue?.publicUserId)
}

async function createUserWithPublicId(userInput, UserModel, attempts = MAX_GENERATION_ATTEMPTS) {
  const Model = UserModel || require('../models/User')
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await Model.create({
        ...userInput,
        publicUserId: generatePublicUserId(),
      })
    } catch (error) {
      if (!isPublicUserIdCollision(error)) throw error
      if (attempt === attempts - 1) {
        const retryError = new Error('Unable to allocate a unique public user ID. Please try again.')
        retryError.statusCode = 503
        throw retryError
      }
    }
  }
  throw new Error('Public user ID generation failed unexpectedly')
}

async function backfillMissingPublicUserIds(UserModel, attempts = MAX_GENERATION_ATTEMPTS) {
  const Model = UserModel || require('../models/User')
  const users = await Model.find({
    $or: [
      { publicUserId: { $exists: false } },
      { publicUserId: null },
      { publicUserId: '' },
    ],
  }).select('_id')

  for (const user of users) {
    let updated = false
    for (let attempt = 0; attempt < attempts && !updated; attempt += 1) {
      const publicUserId = generatePublicUserId()
      try {
        const result = await Model.collection.updateOne({
          _id: user._id,
          $or: [
            { publicUserId: { $exists: false } },
            { publicUserId: null },
            { publicUserId: '' },
          ],
        }, { $set: { publicUserId } })
        updated = result.modifiedCount === 1
          || result.nModified === 1
          || result.matchedCount === 0
      } catch (error) {
        if (!isPublicUserIdCollision(error)) throw error
        if (attempt === attempts - 1) {
          const retryError = new Error('Unable to backfill a unique public user ID.')
          retryError.statusCode = 503
          throw retryError
        }
      }
    }
  }
}

module.exports = {
  ID_ALPHABET,
  PUBLIC_USER_ID_PATTERN,
  backfillMissingPublicUserIds,
  createUserWithPublicId,
  generatePublicUserId,
}

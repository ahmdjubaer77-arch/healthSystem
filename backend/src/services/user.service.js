const { Readable } = require('stream')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const HealthProfile = require('../models/HealthProfile')
const MedicalTimeline = require('../models/MedicalTimeline')
const MedicalDocument = require('../models/MedicalDocument')
const healthSharingService = require('./health-sharing.service')
const BloodRequest = require('../models/BloodRequest')
const EmergencyRequest = require('../models/EmergencyRequest')
const Complaint = require('../models/Complaint')
const { cloudinary, ensureCloudinaryConfigured } = require('../config/cloudinary')

const profileFields = [
  'publicUserId',
  'name',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'location',
  'bloodGroup',
  'profilePicture',
  'role',
  'accountStatus',
  'emailVerified',
  'phoneVerified',
  'createdAt',
  'updatedAt',
  'lastLoginAt',
].join(' ')

const allowedUpdateFields = new Set(['name', 'phone', 'dateOfBirth', 'gender', 'location', 'bloodGroup'])
const locationFields = new Set(['division', 'district', 'upazila', 'area'])
const bloodGroups = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const genders = new Set(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function profileResponse(user) {
  return {
    id: user._id.toString(),
    publicUserId: user.publicUserId,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    dateOfBirth: user.dateOfBirth || null,
    gender: user.gender || null,
    location: user.location || null,
    bloodGroup: user.bloodGroup || null,
    profilePicture: user.profilePicture || null,
    role: user.role,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  }
}

function validateLocation(value) {
  if (value === null) return null

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError('Location must be an object', 400)
  }

  const location = {}
  for (const [field, fieldValue] of Object.entries(value)) {
    if (!locationFields.has(field)) {
      throw createError(`Location field is not allowed: ${field}`, 400)
    }

    if (typeof fieldValue !== 'string' || fieldValue.trim().length > 100) {
      throw createError(`Location ${field} must be a string up to 100 characters`, 400)
    }

    location[field] = fieldValue.trim()
  }

  return location
}

function validateUpdates(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A profile object is required', 400)
  }

  const updates = {}
  for (const [field, value] of Object.entries(input)) {
    if (!allowedUpdateFields.has(field)) {
      throw createError(`Profile field cannot be updated: ${field}`, 400)
    }

    if (field === 'name') {
      if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
        throw createError('Name must be between 2 and 100 characters', 400)
      }
      updates.name = value.trim()
    } else if (field === 'phone') {
      if (value === null || value === '') {
        updates.phone = undefined
      } else if (typeof value !== 'string' || value.trim().length > 20) {
        throw createError('Phone number must be no more than 20 characters', 400)
      } else {
        updates.phone = value.trim() || undefined
      }
    } else if (field === 'dateOfBirth') {
      if (value === null) {
        updates.dateOfBirth = null
      } else if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw createError('Date of birth must use YYYY-MM-DD format', 400)
      } else {
        const date = new Date(`${value}T00:00:00.000Z`)
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
          throw createError('Date of birth must be a valid date', 400)
        }
        updates.dateOfBirth = date
      }
    } else if (field === 'gender') {
      if (value === null) {
        updates.gender = null
      } else if (typeof value !== 'string' || !genders.has(value.toUpperCase())) {
        throw createError('Gender is invalid', 400)
      } else {
        updates.gender = value.toUpperCase()
      }
    } else if (field === 'location') {
      updates.location = validateLocation(value)
    } else if (field === 'bloodGroup') {
      if (value === null) {
        updates.bloodGroup = null
      } else if (typeof value !== 'string' || !bloodGroups.has(value)) {
        throw createError('Blood group is invalid', 400)
      } else {
        updates.bloodGroup = value
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError('At least one profile field is required', 400)
  }

  return updates
}

async function getMyProfile(userId) {
  const user = await User.findById(userId).select(profileFields)
  if (!user) {
    throw createError('User profile not found', 404)
  }

  return profileResponse(user)
}

async function updateMyProfile(userId, input) {
  const updates = validateUpdates(input)
  const user = await User.findById(userId).select(profileFields)
  if (!user) {
    throw createError('User profile not found', 404)
  }

  for (const [field, value] of Object.entries(updates)) {
    user.set(field, value)
  }

  await user.save()
  return profileResponse(user)
}

async function changeMyPassword(userId, input = {}) {
  const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : ''
  const newPassword = typeof input.newPassword === 'string' ? input.newPassword : ''
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : ''

  if (!currentPassword) throw createError('Your current password is required.', 400)
  if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    throw createError('New password must be at least 8 characters and no more than 72 bytes.', 400)
  }
  if (newPassword !== confirmPassword) throw createError('Passwords do not match.', 400)
  if (newPassword === currentPassword) {
    throw createError('Choose a new password different from your current password.', 400)
  }

  const user = await User.findById(userId).select('+passwordHash')
  if (!user) throw createError('User profile not found', 404)
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw createError('Your current password is incorrect.', 401)
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  await user.save()
  return { changed: true }
}

async function deleteMyAccount(userId, input = {}) {
  const password = typeof input.currentPassword === 'string' ? input.currentPassword : ''
  if (!password) {
    throw createError('Your current password is required to delete your account', 400)
  }

  const user = await User.findById(userId).select('+passwordHash')
  if (!user) {
    throw createError('User profile not found', 404)
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw createError('Your current password is incorrect', 401)
  }

  const documents = await MedicalDocument.find({ user: userId })
  const media = [
    ...documents.map((document) => ({
      publicId: document.cloudinaryPublicId,
      resourceType: document.resourceType,
    })),
    ...(user.profilePicture?.publicId
      ? [{ publicId: user.profilePicture.publicId, resourceType: 'image' }]
      : []),
  ]

  if (media.length) {
    ensureCloudinaryConfigured()
    for (const resource of media) {
      let result
      try {
        result = await cloudinary.uploader.destroy(resource.publicId, {
          resource_type: resource.resourceType,
          type: 'authenticated',
          invalidate: true,
        })
      } catch {
        throw createError('Unable to delete your stored profile or medical files', 502)
      }

      if (result?.result !== 'ok') {
        throw createError('Unable to delete your stored profile or medical files', 502)
      }
    }
  }

  await healthSharingService.revokeSharesForAccountDeletion(userId)
  await Promise.all([
    HealthProfile.deleteOne({ user: userId }),
    MedicalTimeline.deleteMany({ user: userId }),
    MedicalDocument.deleteMany({ user: userId }),
    BloodRequest.deleteMany({ requesterId: userId }),
    EmergencyRequest.deleteMany({ requesterId: userId }),
    Complaint.deleteMany({ reporterId: userId }),
    BloodRequest.updateMany({ hospitalId: userId }, { $unset: { hospitalId: 1 } }),
    EmergencyRequest.updateMany(
      { $or: [{ hospitalId: userId }, { ambulanceId: userId }] },
      { $unset: { hospitalId: 1, ambulanceId: 1 } },
    ),
    Complaint.updateMany(
      {
        $or: [
          { assignedAdminId: userId },
          { 'internalNotes.authorId': userId },
          { resolvedBy: userId },
          { rejectedBy: userId },
          { escalatedBy: userId },
        ],
      },
      {
        $unset: {
          assignedAdminId: 1,
          resolvedBy: 1,
          rejectedBy: 1,
          escalatedBy: 1,
        },
        $pull: { internalNotes: { authorId: userId } },
      },
    ),
  ])
  await user.deleteOne()

  return { deleted: true }
}

function uploadProfilePictureToCloudinary(userId, file) {
  ensureCloudinaryConfigured()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      resource_type: 'image',
      type: 'authenticated',
      access_mode: 'authenticated',
      folder: `profile-pictures/${userId}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    }, (error, result) => {
      if (error || !result?.public_id || !result?.secure_url) {
        return reject(createError('Unable to store the profile picture', 502))
      }

      resolve(result)
    })

    Readable.from(file.buffer).pipe(uploadStream).on('error', () => {
      reject(createError('Unable to store the profile picture', 502))
    })
  })
}

async function uploadProfilePicture(userId, file) {
  const upload = await uploadProfilePictureToCloudinary(userId, file)
  const user = await User.findById(userId)

  if (!user) {
    await cloudinary.uploader.destroy(upload.public_id, { invalidate: true })
    throw createError('User profile not found', 404)
  }

  if (user.profilePicture?.publicId) {
    await cloudinary.uploader.destroy(user.profilePicture.publicId, { invalidate: true })
  }

  user.profilePicture = {
    url: upload.secure_url,
    publicId: upload.public_id,
  }
  await user.save()
  return profileResponse(user)
}

async function deleteProfilePicture(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw createError('User profile not found', 404)
  }

  if (user.profilePicture?.publicId) {
    await cloudinary.uploader.destroy(user.profilePicture.publicId, { invalidate: true })
  }

  user.profilePicture = undefined
  await user.save()
  return profileResponse(user)
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deleteMyAccount,
  uploadProfilePicture,
  deleteProfilePicture,
}
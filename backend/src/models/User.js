const mongoose = require('mongoose')
const { generatePublicUserId } = require('../utils/public-user-id')

const roles = [
  'PATIENT',
  'DOCTOR',
  'PHARMACY',
  'HOSPITAL',
  'BLOOD_DONOR',
  'AMBULANCE_PROVIDER',
  'ADMIN',
  'SUPER_ADMIN',
]

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const genders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']

const userSchema = new mongoose.Schema({
  publicUserId: {
    type: String,
    required: true,
    immutable: true,
    default: generatePublicUserId,
    match: /^BDH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/,
    unique: true,
    sparse: true,
  },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: { type: String, trim: true, unique: true, sparse: true, maxlength: 20 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: roles, default: 'PATIENT', required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: genders },
  location: mongoose.Schema.Types.Mixed,
  bloodGroup: { type: String, enum: bloodGroups },
  donorAvailability: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE'] },
  donorVerificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'] },
  donorVerificationReason: { type: String, trim: true, maxlength: 500, default: '' },
  donorStandalone: { type: Boolean, default: false },
  donorPhoneConsent: { type: Boolean, default: false },
  donorVerifiedAt: Date,
  donorSuspendedAt: Date,
  donorPreviousVerificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'] },
  donorLastDonationDate: Date,
  donorPreferredContactMethod: { type: String, enum: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'] },
  donorNotes: { type: String, trim: true, maxlength: 1000, default: '' },
  profilePicture: {
    url: String,
    publicId: String,
  },
  accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationRequired: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLoginAt: Date,
}, { timestamps: true })

userSchema.pre('validate', function assignPublicUserId() {
  if (!this.publicUserId) this.publicUserId = generatePublicUserId()
})

module.exports = mongoose.model('User', userSchema)
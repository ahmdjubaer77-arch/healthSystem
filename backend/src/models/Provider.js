const mongoose = require('mongoose')

const PROVIDER_TYPES = ['Doctor', 'Hospital', 'Pharmacy', 'Ambulance Provider']
const VERIFICATION_STATUSES = ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED']

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 160,
  },
  providerType: {
    type: String,
    required: true,
    enum: PROVIDER_TYPES,
  },
  specialty: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  qualification: {
    type: String,
    trim: true,
    maxlength: 240,
    default: '',
  },
  experienceYears: { type: Number, min: 0, max: 80 },
  hospitalName: { type: String, trim: true, maxlength: 160, default: '' },
  consultationFee: { type: Number, min: 0 },
  serviceAreas: [{
    type: String,
    trim: true,
    maxlength: 120,
  }],
  operationalStatus: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
    default: 'OFFLINE',
    index: true,
  },
  vehicles: [{
    vehicleType: { type: String, trim: true, maxlength: 100 },
    registrationNumber: { type: String, trim: true, maxlength: 40 },
    capacity: { type: Number, min: 1, max: 100 },
    equipment: [{ type: String, trim: true, maxlength: 100 }],
  }],
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 160,
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  address: {
    type: String,
    trim: true,
    maxlength: 240,
  },
  division: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  district: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  upazila: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  verificationStatus: {
    type: String,
    required: true,
    enum: VERIFICATION_STATUSES,
    default: 'PENDING',
    index: true,
  },
  verificationReason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  registrationNumber: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  licenseNumber: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  submittedDocuments: [{
    documentType: { type: String, trim: true, maxlength: 100, required: true },
    fileName: { type: String, trim: true, maxlength: 255, required: true },
    storageId: { type: String, trim: true, maxlength: 255, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  verifiedAt: Date,
  suspendedAt: Date,
}, {
  timestamps: true,
  collection: 'providers',
})

providerSchema.index({ providerType: 1, verificationStatus: 1, district: 1 })
providerSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Provider', providerSchema)
module.exports.PROVIDER_TYPES = PROVIDER_TYPES
module.exports.VERIFICATION_STATUSES = VERIFICATION_STATUSES

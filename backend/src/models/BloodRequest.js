const mongoose = require('mongoose')

const BLOOD_REQUEST_STATUSES = ['PENDING', 'ACTIVE', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED']

const bloodRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterName: { type: String, required: true, trim: true, maxlength: 100 },
  bloodGroup: { type: String, required: true, trim: true, maxlength: 10 },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  hospitalName: { type: String, trim: true, maxlength: 160 },
  division: { type: String, trim: true, maxlength: 100 },
  district: { type: String, trim: true, maxlength: 120 },
  upazila: { type: String, trim: true, maxlength: 120 },
  locationType: { type: String, trim: true, maxlength: 60 },
  status: { type: String, enum: BLOOD_REQUEST_STATUSES, default: 'PENDING', index: true },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'], default: 'PENDING', index: true },
  verificationReason: { type: String, trim: true, maxlength: 500, default: '' },
  reportReason: { type: String, trim: true, maxlength: 500, default: '' },
  reportedAt: Date,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

bloodRequestSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('BloodRequest', bloodRequestSchema)
module.exports.BLOOD_REQUEST_STATUSES = BLOOD_REQUEST_STATUSES

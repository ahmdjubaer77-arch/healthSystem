const mongoose = require('mongoose')

const EMERGENCY_REQUEST_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']

const emergencyRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterName: { type: String, required: true, trim: true, maxlength: 100 },
  requestType: { type: String, required: true, trim: true, maxlength: 120 },
  division: { type: String, trim: true, maxlength: 100 },
  district: { type: String, trim: true, maxlength: 120 },
  upazila: { type: String, trim: true, maxlength: 120 },
  locationType: { type: String, trim: true, maxlength: 60 },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  hospitalName: { type: String, trim: true, maxlength: 160 },
  ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  ambulanceName: { type: String, trim: true, maxlength: 160 },
  status: { type: String, enum: EMERGENCY_REQUEST_STATUSES, default: 'PENDING', index: true },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'], default: 'PENDING', index: true },
  verificationReason: { type: String, trim: true, maxlength: 500, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

emergencyRequestSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema)
module.exports.EMERGENCY_REQUEST_STATUSES = EMERGENCY_REQUEST_STATUSES

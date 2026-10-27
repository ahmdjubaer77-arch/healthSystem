const mongoose = require('mongoose')

const COMPLAINT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']
const COMPLAINT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const complaintSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  priority: { type: String, enum: COMPLAINT_PRIORITIES, default: 'MEDIUM', index: true },
  status: { type: String, enum: COMPLAINT_STATUSES, default: 'OPEN', index: true },
  assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  internalNotes: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  }],
  resolutionInfo: { type: String, trim: true, maxlength: 2000, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: Date,
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: '' },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt: Date,
  escalationReason: { type: String, trim: true, maxlength: 1000, default: '' },
  escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalatedAt: Date,
}, { timestamps: true })

complaintSchema.index({ status: 1, priority: 1, createdAt: -1 })

module.exports = mongoose.model('Complaint', complaintSchema)
module.exports.COMPLAINT_STATUSES = COMPLAINT_STATUSES
module.exports.COMPLAINT_PRIORITIES = COMPLAINT_PRIORITIES
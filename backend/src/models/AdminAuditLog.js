const mongoose = require('mongoose')

const adminAuditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  actorRole: {
    type: String,
    enum: ['ADMIN', 'SUPER_ADMIN'],
    required: true,
  },
  action: {
    type: String,
    required: true,
    maxlength: 100,
  },
  entityType: {
    type: String,
    required: true,
    maxlength: 100,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS',
    index: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    maxlength: 45,
  },
  userAgent: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
  collection: 'adminAuditLogs',
})

adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema)

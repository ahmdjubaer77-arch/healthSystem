const mongoose = require('mongoose')

const scopeSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    required: true,
    enum: ['PROFILE', 'TIMELINE', 'DOCUMENT'],
  },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  resourceIds: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
}, { _id: false })

const healthShareSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  scopes: {
    type: [scopeSchema],
    required: true,
    validate: {
      validator: (scopes) => Array.isArray(scopes) && scopes.length > 0,
      message: 'At least one sharing scope is required',
    },
  },
  status: { type: String, required: true, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE', index: true },
  readOnly: { type: Boolean, required: true, default: true, immutable: true },
  consentedAt: { type: Date, required: true, default: Date.now, immutable: true },
  expiresAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'healthShares' })

healthShareSchema.index({ ownerUserId:  1, createdAt: -1 })
healthShareSchema.index({ recipientUserId: 1, status: 1, expiresAt: 1 })

module.exports = mongoose.model('HealthShare', healthShareSchema)

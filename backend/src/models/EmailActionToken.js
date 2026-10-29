const mongoose = require('mongoose')

const emailActionTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'],
    required: true,
  },
  tokenHash: { type: String, required: true, unique: true },
  attempts: { type: Number, default: 0 },
  targetEmail: { type: String, lowercase: true, trim: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

emailActionTokenSchema.index({ userId: 1, purpose: 1 })
emailActionTokenSchema.index({ purpose: 1, targetEmail: 1, createdAt: -1 })

module.exports = mongoose.model('EmailActionToken', emailActionTokenSchema)

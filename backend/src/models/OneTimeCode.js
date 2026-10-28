const mongoose = require('mongoose')

const oneTimeCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pendingEmail: { type: String, lowercase: true, trim: true, default: null },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  resetTokenHash: { type: String, default: null },
  resetExpiresAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

oneTimeCodeSchema.index({ email: 1, purpose: 1 }, { unique: true })
oneTimeCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('OneTimeCode', oneTimeCodeSchema)

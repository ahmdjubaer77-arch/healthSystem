const mongoose = require('mongoose')

const medicalDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: { type: String, required: true, enum: ['PRESCRIPTION', 'MEDICAL_REPORT'] },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  cloudinaryPublicId: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  resourceType: { type: String, required: true, enum: ['image', 'raw'] },
  format: { type: String, required: true, maxlength: 20 },
  originalFileName: { type: String, required: true, maxlength: 255 },
  fileSize: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
}, { timestamps: true, collection: 'medicalDocuments' })

medicalDocumentSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema)
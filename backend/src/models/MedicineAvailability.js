const mongoose = require('mongoose')

const medicineAvailabilitySchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  genericName: { type: String, trim: true, maxlength: 160, default: '' },
  strength: { type: String, required: true, trim: true, maxlength: 80 },
  dosageForm: { type: String, required: true, trim: true, maxlength: 80 },
  availability: {
    type: String,
    enum: ['AVAILABLE', 'UNAVAILABLE'],
    required: true,
    default: 'AVAILABLE',
    index: true,
  },
}, { timestamps: true })

medicineAvailabilitySchema.index({ pharmacyId: 1, availability: 1, updatedAt: -1 })

module.exports = mongoose.model('MedicineAvailability', medicineAvailabilitySchema)

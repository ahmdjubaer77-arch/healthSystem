const mongoose = require('mongoose')

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100 },
  relationship: { type: String, trim: true, maxlength: 60 },
  phone: { type: String, trim: true, maxlength: 20 },
}, { _id: false })

const healthProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bloodGroup: { type: String, trim: true, maxlength: 20, default: '' },
  emergencyContact: { type: emergencyContactSchema, default: undefined },
  allergies: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
  existingConditions: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
  currentMedications: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
  familyMedicalHistory: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
  emergencyMedicalInfo: { type: String, trim: true, maxlength: 2000, default: '' },
}, { timestamps: true, collection: 'healthProfiles' })

module.exports = mongoose.model('HealthProfile', healthProfileSchema)
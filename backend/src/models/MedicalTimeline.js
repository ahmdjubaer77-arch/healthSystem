const mongoose = require('mongoose')

const timelineTypes = [
  'DIAGNOSIS',
  'VISIT',
  'HOSPITALIZATION',
  'SURGERY',
  'VACCINATION',
  'MEDICATION',
  'OTHER',
]

const medicalTimelineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: { type: String, required: true, enum: timelineTypes },
  recordType: {
    type: String,
    enum: [
      'MEDICAL_RECORD',
      'PRESCRIPTION',
      'REPORT',
      'DOCTOR_VISIT',
      'HOSPITAL_VISIT',
      'VACCINATION',
      'HEALTH_PROBLEM',
      'CURRENT_MEDICINE',
      'DOCTOR_CONSULTATION',
      'CHECKUP_REPORT',
    ],
    default: null,
  },
  source: { type: String, enum: ['PATIENT_ENTERED', 'CLINICIAN_AUTHORED'], default: 'PATIENT_ENTERED' },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  date: { type: Date, required: true },
}, { timestamps: true, collection: 'medicalTimelines' })

medicalTimelineSchema.index({ user: 1, date: -1, createdAt: -1 })

module.exports = mongoose.model('MedicalTimeline', medicalTimelineSchema)
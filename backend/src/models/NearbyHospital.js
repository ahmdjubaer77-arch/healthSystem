const mongoose = require('mongoose')

const nearbyHospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  address: { type: String, required: true, trim: true, maxlength: 240 },
  area: { type: String, trim: true, maxlength: 160, default: '' },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  type: { type: String, required: true, enum: ['Government', 'Private'] },
  services: [{ type: String, trim: true, maxlength: 80 }],
  emergencyAvailable: { type: Boolean, default: false },
  operatingStatus: { type: String, required: true, enum: ['Open', 'Closed', 'Unknown'], default: 'Unknown' },
  verificationStatus: { type: String, required: true, enum: ['VERIFIED', 'UNVERIFIED'], default: 'UNVERIFIED' },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates) => coordinates.length === 2 && coordinates[0] >= -180 && coordinates[0] <= 180 && coordinates[1] >= -90 && coordinates[1] <= 90,
        message: 'Location coordinates must be [longitude, latitude] within valid ranges.',
      },
    },
  },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'nearbyHospitals' })

nearbyHospitalSchema.index({ location: '2dsphere' })
nearbyHospitalSchema.index({ type: 1, name: 1 })

module.exports = mongoose.model('NearbyHospital', nearbyHospitalSchema)

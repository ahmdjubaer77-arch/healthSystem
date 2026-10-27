const mongoose = require('mongoose')

const healthAccessEventSchema = new mongoose.Schema({
  shareId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthShare', required: true, immutable: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  action: {
    type: String,
    required: true,
    enum: ['VIEW', 'DOWNLOAD', 'ACCESS_DENIED', 'SHARE_GRANTED', 'SHARE_REVOKED'],
    immutable: true,
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['PROFILE', 'TIMELINE', 'DOCUMENT', 'SHARE'],
    immutable: true,
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null, immutable: true },
  result: { type: String, required: true, enum: ['SUCCESS', 'DENIED'], immutable: true },
  timestamp: { type: Date, required: true, default: Date.now, immutable: true, index: true },
}, { versionKey: false, collection: 'healthAccessEvents' })

healthAccessEventSchema.index({ ownerUserId: 1, timestamp: -1 })
healthAccessEventSchema.index({ shareId: 1, timestamp: -1 })

for (const operation of [
  'update',
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
  'replaceOne',
]) {
  healthAccessEventSchema.pre(operation, function preventAuditMutation() {
    throw new Error('Health access events are append-only')
  })
}
healthAccessEventSchema.pre('deleteOne', { document: true, query: false }, function preventDocumentAuditDeletion() {
  throw new Error('Health access events are append-only')
})

module.exports = mongoose.model('HealthAccessEvent', healthAccessEventSchema)

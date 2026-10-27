const express = require('express')
const mongoose = require('mongoose')
const healthController = require('../controllers/health.controller')
const healthSharingController = require('../controllers/health-sharing.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { uploadMedicalDocument } = require('../middleware/upload.middleware')

const router = express.Router()

router.get('/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected ? 'API is healthy' : 'Database connection unavailable',
    data: {
      server: 'up',
      database: databaseConnected ? 'connected' : 'disconnected',
    },
  })
})

router.get('/health/profile', authenticate, requireRole('PATIENT'), healthController.getHealthProfile)
router.post('/health/profile', authenticate, requireRole('PATIENT'), healthController.createHealthProfile)
router.patch('/health/profile', authenticate, requireRole('PATIENT'), healthController.updateHealthProfile)

router.get('/health/timeline', authenticate, requireRole('PATIENT'), healthController.getTimeline)
router.post('/health/timeline', authenticate, requireRole('PATIENT'), healthController.createTimelineEntry)
router.patch('/health/timeline/:id', authenticate, requireRole('PATIENT'), healthController.updateTimelineEntry)
router.delete('/health/timeline/:id', authenticate, requireRole('PATIENT'), healthController.deleteTimelineEntry)

router.post('/health/documents', authenticate, requireRole('PATIENT'), uploadMedicalDocument, healthController.uploadMedicalDocument)
router.get('/health/documents', authenticate, requireRole('PATIENT'), healthController.getMedicalDocuments)
router.get('/health/documents/:id/content', authenticate, requireRole('PATIENT'), healthController.getMedicalDocumentContent)
router.delete('/health/documents/:id', authenticate, requireRole('PATIENT'), healthController.deleteMedicalDocument)

router.get('/health/shares/recipient', authenticate, requireRole('PATIENT'), healthSharingController.lookupRecipient)
router.get('/health/shares/received', authenticate, requireRole('PATIENT'), healthSharingController.listReceivedShares)
router.get('/health/shares', authenticate, requireRole('PATIENT'), healthSharingController.listShares)
router.post('/health/shares', authenticate, requireRole('PATIENT'), healthSharingController.createShare)
router.post('/health/shares/:shareId/revoke', authenticate, requireRole('PATIENT'), healthSharingController.revokeShare)
router.get('/health/access-history', authenticate, requireRole('PATIENT'), healthSharingController.listAccessHistory)

router.get('/health/shared/:shareId/profile', authenticate, healthSharingController.getSharedProfile)
router.get('/health/shared/:shareId/timeline', authenticate, healthSharingController.listSharedTimeline)
router.get('/health/shared/:shareId/documents', authenticate, healthSharingController.listSharedDocuments)
router.get('/health/shared/:shareId/documents/:documentId/content', authenticate, healthSharingController.getSharedDocumentContent)

module.exports = router
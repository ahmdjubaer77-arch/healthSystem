const express = require('express')
const bloodDonorController = require('../controllers/blood.donor.controller')
const bloodRequestController = require('../controllers/blood.request.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')

const router = express.Router()

router.get('/blood/requests', bloodRequestController.listPublic)
router.get('/blood/requests/mine', authenticate, requireRole('PATIENT'), bloodRequestController.listMine)
router.get('/blood/requests/:id', bloodRequestController.getPublic)
router.post('/blood/requests', authenticate, requireRole('PATIENT'), bloodRequestController.create)
router.post('/blood/requests/:id/report', authenticate, requireRole('PATIENT'), bloodRequestController.report)
router.get('/blood/donors', bloodDonorController.getPublicDonors)

module.exports = router
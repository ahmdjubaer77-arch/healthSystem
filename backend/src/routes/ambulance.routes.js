const express = require('express')
const ambulanceController = require('../controllers/admin.ambulance.controller')

const router = express.Router()

router.get('/ambulances', ambulanceController.getPublicAmbulances)
router.get('/ambulances/:id', ambulanceController.getPublicAmbulance)

module.exports = router

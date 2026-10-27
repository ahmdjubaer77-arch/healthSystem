const express = require('express')
const hospitalController = require('../controllers/hospital.controller')

const router = express.Router()

router.get('/locations/options', hospitalController.getPublicLocationOptions)
router.get('/hospitals', hospitalController.getPublicHospitals)
router.get('/hospitals/nearby', hospitalController.getNearbyHospitals)
router.get('/hospitals/:id', hospitalController.getNearbyHospital)

module.exports = router

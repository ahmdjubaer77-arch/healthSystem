const express = require('express')
const doctorController = require('../controllers/admin.doctor.controller')

const router = express.Router()

router.get('/doctors', doctorController.getPublicDoctors)
router.get('/doctors/:id', doctorController.getPublicDoctor)

module.exports = router

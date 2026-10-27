const express = require('express')
const bloodDonorController = require('../controllers/blood.donor.controller')

const router = express.Router()

router.get('/blood/donors', bloodDonorController.getPublicDonors)

module.exports = router
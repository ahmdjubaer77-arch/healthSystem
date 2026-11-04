const express = require('express')
const medicineController = require('../controllers/medicine.controller')

const router = express.Router()

router.get('/medicines', medicineController.search)

module.exports = router

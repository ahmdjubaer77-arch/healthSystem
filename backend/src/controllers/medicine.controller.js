const medicineService = require('../services/medicine.service')

async function search(req, res, next) {
  try {
    const result = await medicineService.searchMedicineAvailability(req.query)
    res.status(200).json({ success: true, message: 'Medicine availability retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

module.exports = { search }

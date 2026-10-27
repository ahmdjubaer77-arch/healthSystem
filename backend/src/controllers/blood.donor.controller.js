const donorService = require('../services/blood.donor.service')

async function getPublicDonors(req, res, next) {
  try {
    const result = await donorService.getPublicDonors(req.query)
    res.status(200).json({ success: true, message: 'Blood donors retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

module.exports = { getPublicDonors }
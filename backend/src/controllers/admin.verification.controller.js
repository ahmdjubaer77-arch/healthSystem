const adminVerificationService = require('../services/admin.verification.service')

async function getVerificationSummary(req, res, next) {
  try {
    const summary = await adminVerificationService.getVerificationSummary()
    res.status(200).json({
      success: true,
      message: 'Verification summary retrieved successfully',
      data: summary,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getVerificationSummary }
